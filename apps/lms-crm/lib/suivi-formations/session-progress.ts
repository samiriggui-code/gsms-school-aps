import { prisma } from '@/lib/prisma';

export type SuiviSessionPhase = 'upcoming' | 'running' | 'past' | 'unknown';

export type SuiviParticipantProgress = {
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  quizPassed: number;
  quizTotal: number;
  lastActivityAt: Date | null;
};

type CourseProgressBundle = {
  chapterIds: string[];
  chapters: Array<{ id: string; title: string; position: number }>;
  quizActivityIds: string[];
};

export function resolveSuiviSessionPhase(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  now: Date = new Date(),
): SuiviSessionPhase {
  if (!startDate) return 'unknown';
  if (startDate > now) return 'upcoming';
  if (endDate && endDate < now) return 'past';
  if (startDate <= now) return 'running';
  return 'unknown';
}

export async function loadCourseProgressBundle(courseId: string | null): Promise<CourseProgressBundle | null> {
  if (!courseId) return null;

  const chapters = await prisma.chapter.findMany({
    where: { courseId, isPublished: true },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      title: true,
      position: true,
      activities: {
        where: { isPublished: true, type: 'QUIZ' },
        select: { id: true },
      },
    },
  });

  const quizActivityIds: string[] = [];
  for (const ch of chapters) {
    for (const act of ch.activities) quizActivityIds.push(act.id);
  }

  return {
    chapterIds: chapters.map((c) => c.id),
    chapters: chapters.map((c) => ({ id: c.id, title: c.title, position: c.position })),
    quizActivityIds,
  };
}

export async function computeProgressForUsers(
  userIds: string[],
  bundle: CourseProgressBundle | null,
): Promise<Map<string, SuiviParticipantProgress>> {
  const result = new Map<string, SuiviParticipantProgress>();

  if (!bundle || userIds.length === 0) {
    for (const uid of userIds) {
      result.set(uid, {
        progressPercent: 0,
        completedChapters: 0,
        totalChapters: bundle?.chapterIds.length ?? 0,
        quizPassed: 0,
        quizTotal: bundle?.quizActivityIds.length ?? 0,
        lastActivityAt: null,
      });
    }
    return result;
  }

  const totalChapters = bundle.chapterIds.length;
  const quizTotal = bundle.quizActivityIds.length;

  const [progressRows, quizRows] = await Promise.all([
    bundle.chapterIds.length
      ? prisma.userProgress.findMany({
          where: {
            userId: { in: userIds },
            chapterId: { in: bundle.chapterIds },
            isCompleted: true,
          },
          select: { userId: true, updatedAt: true },
        })
      : Promise.resolve([]),
    bundle.quizActivityIds.length
      ? prisma.quizAttempt.findMany({
          where: {
            userId: { in: userIds },
            activityId: { in: bundle.quizActivityIds },
            passed: true,
          },
          select: { userId: true, activityId: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const completedByUser = new Map<string, number>();
  const lastByUser = new Map<string, Date>();
  for (const row of progressRows) {
    completedByUser.set(row.userId, (completedByUser.get(row.userId) ?? 0) + 1);
    const prev = lastByUser.get(row.userId);
    if (!prev || row.updatedAt > prev) lastByUser.set(row.userId, row.updatedAt);
  }

  const passedQuizByUser = new Map<string, Set<string>>();
  for (const row of quizRows) {
    if (!passedQuizByUser.has(row.userId)) passedQuizByUser.set(row.userId, new Set());
    passedQuizByUser.get(row.userId)!.add(row.activityId);
    const prev = lastByUser.get(row.userId);
    if (!prev || row.createdAt > prev) lastByUser.set(row.userId, row.createdAt);
  }

  for (const uid of userIds) {
    const completed = completedByUser.get(uid) ?? 0;
    const quizPassed = passedQuizByUser.get(uid)?.size ?? 0;
    result.set(uid, {
      progressPercent: totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0,
      completedChapters: completed,
      totalChapters,
      quizPassed,
      quizTotal,
      lastActivityAt: lastByUser.get(uid) ?? null,
    });
  }

  return result;
}

export async function loadSessionCourseBundle(sessionId: string): Promise<{
  courseId: string | null;
  bundle: CourseProgressBundle | null;
}> {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: { formation: { select: { courseId: true } } },
  });
  const courseId = session?.formation.courseId ?? null;
  const bundle = await loadCourseProgressBundle(courseId);
  return { courseId, bundle };
}
