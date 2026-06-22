import { prisma } from '@/lib/prisma';
import {
  computeProgressForUsers,
  loadCourseProgressBundle,
} from '@/lib/suivi-formations/session-progress';

export type SuiviChapterProgressRow = {
  chapterId: string;
  title: string;
  position: number;
  completed: boolean;
  completedAt: string | null;
};

export type SuiviQuizProgressRow = {
  activityId: string;
  name: string;
  chapterTitle: string;
  bestScore: number | null;
  passed: boolean;
  attemptCount: number;
  lastAttemptAt: string | null;
};

export type SuiviParticipantLearningDetail = {
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  quizPassed: number;
  quizTotal: number;
  lastActivityAt: string | null;
  chapters: SuiviChapterProgressRow[];
  quizzes: SuiviQuizProgressRow[];
};

export async function loadParticipantLearningDetail(input: {
  sessionId: string;
  participantId: string;
}): Promise<SuiviParticipantLearningDetail | null> {
  const participant = await prisma.formationSessionParticipant.findFirst({
    where: { id: input.participantId, sessionId: input.sessionId },
    select: {
      userId: true,
      session: { select: { formation: { select: { courseId: true } } } },
    },
  });
  if (!participant) return null;

  const courseId = participant.session.formation.courseId;
  const bundle = await loadCourseProgressBundle(courseId);
  const progressMap = await computeProgressForUsers([participant.userId], bundle);
  const prog = progressMap.get(participant.userId) ?? {
    progressPercent: 0,
    completedChapters: 0,
    totalChapters: bundle?.chapterIds.length ?? 0,
    quizPassed: 0,
    quizTotal: bundle?.quizActivityIds.length ?? 0,
    lastActivityAt: null,
  };

  let chapters: SuiviChapterProgressRow[] = [];
  if (bundle) {
    const doneRows = await prisma.userProgress.findMany({
      where: {
        userId: participant.userId,
        chapterId: { in: bundle.chapterIds },
        isCompleted: true,
      },
      select: { chapterId: true, updatedAt: true },
    });
    const doneMap = new Map(doneRows.map((r) => [r.chapterId, r.updatedAt]));
    chapters = bundle.chapters.map((ch) => ({
      chapterId: ch.id,
      title: ch.title,
      position: ch.position,
      completed: doneMap.has(ch.id),
      completedAt: doneMap.get(ch.id)?.toISOString() ?? null,
    }));
  }

  let quizzes: SuiviQuizProgressRow[] = [];
  if (bundle && bundle.quizActivityIds.length > 0 && courseId) {
    const chapterRows = await prisma.chapter.findMany({
      where: { courseId, isPublished: true },
      select: {
        title: true,
        activities: {
          where: { isPublished: true, type: 'QUIZ', id: { in: bundle.quizActivityIds } },
          select: { id: true, name: true },
        },
      },
    });
    const quizById = new Map<string, { name: string; chapterTitle: string }>();
    for (const ch of chapterRows) {
      for (const act of ch.activities) {
        quizById.set(act.id, { name: act.name, chapterTitle: ch.title });
      }
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: participant.userId, activityId: { in: bundle.quizActivityIds } },
      orderBy: { createdAt: 'desc' },
      select: { activityId: true, score: true, passed: true, createdAt: true },
    });

    const byActivity = new Map<string, typeof attempts>();
    for (const a of attempts) {
      if (!byActivity.has(a.activityId)) byActivity.set(a.activityId, []);
      byActivity.get(a.activityId)!.push(a);
    }

    quizzes = bundle.quizActivityIds.map((activityId) => {
      const meta = quizById.get(activityId) ?? { name: 'Quiz', chapterTitle: '—' };
      const list = byActivity.get(activityId) ?? [];
      const best = list.reduce<(typeof attempts)[0] | null>(
        (acc, cur) => (!acc || cur.score > acc.score ? cur : acc),
        null,
      );
      return {
        activityId,
        name: meta.name,
        chapterTitle: meta.chapterTitle,
        bestScore: best?.score ?? null,
        passed: list.some((x) => x.passed),
        attemptCount: list.length,
        lastAttemptAt: list[0]?.createdAt.toISOString() ?? null,
      };
    });
  }

  return {
    progressPercent: prog.progressPercent,
    completedChapters: prog.completedChapters,
    totalChapters: prog.totalChapters,
    quizPassed: prog.quizPassed,
    quizTotal: prog.quizTotal,
    lastActivityAt: prog.lastActivityAt?.toISOString() ?? null,
    chapters,
    quizzes,
  };
}
