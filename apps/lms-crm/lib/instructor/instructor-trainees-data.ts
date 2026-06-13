import { prisma } from '@/lib/prisma';
import { listInstructorSessionIds } from '@/lib/instructor/instructor-access';
import type {
  CohortActivityPayload,
  CohortActivityPoint,
  InstructorTraineeChapterProgress,
  InstructorTraineeDetail,
  InstructorTraineeQuizRow,
  InstructorTraineeRow,
} from '@/lib/instructor/instructor-types';

export type {
  CohortActivityPayload,
  CohortActivityPoint,
  InstructorTraineeChapterProgress,
  InstructorTraineeDetail,
  InstructorTraineeQuizRow,
  InstructorTraineeRow,
} from '@/lib/instructor/instructor-types';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

type CourseProgressBundle = {
  chapterIds: string[];
  chapters: Array<{ id: string; title: string; position: number }>;
  quizActivityIds: string[];
  quizById: Map<string, { name: string; chapterTitle: string }>;
};

async function loadCourseProgressBundle(courseId: string | null): Promise<CourseProgressBundle | null> {
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
        select: { id: true, name: true },
      },
    },
  });

  const quizById = new Map<string, { name: string; chapterTitle: string }>();
  const quizActivityIds: string[] = [];
  for (const ch of chapters) {
    for (const act of ch.activities) {
      quizActivityIds.push(act.id);
      quizById.set(act.id, { name: act.name, chapterTitle: ch.title });
    }
  }

  return {
    chapterIds: chapters.map((c) => c.id),
    chapters: chapters.map((c) => ({ id: c.id, title: c.title, position: c.position })),
    quizActivityIds,
    quizById,
  };
}

async function computeProgressForUsers(
  userIds: string[],
  bundle: CourseProgressBundle | null,
): Promise<
  Map<
    string,
    {
      progressPercent: number;
      completedChapters: number;
      totalChapters: number;
      quizPassed: number;
      quizTotal: number;
      lastActivityAt: Date | null;
    }
  >
> {
  const result = new Map<
    string,
    {
      progressPercent: number;
      completedChapters: number;
      totalChapters: number;
      quizPassed: number;
      quizTotal: number;
      lastActivityAt: Date | null;
    }
  >();

  if (!bundle || userIds.length === 0) {
    for (const uid of userIds) {
      result.set(uid, {
        progressPercent: 0,
        completedChapters: 0,
        totalChapters: 0,
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

export async function listInstructorTrainees(
  trainerUserId: string,
  sessionId?: string | null,
): Promise<InstructorTraineeRow[]> {
  const allowedSessionIds = sessionId
    ? (await prisma.formationSession.findFirst({
        where: { id: sessionId, trainerUserId },
        select: { id: true },
      }))
      ? [sessionId]
      : []
    : await listInstructorSessionIds(trainerUserId);

  if (allowedSessionIds.length === 0) return [];

  const participants = await prisma.formationSessionParticipant.findMany({
    where: { sessionId: { in: allowedSessionIds } },
    orderBy: [{ session: { startDate: 'asc' } }, { user: { name: 'asc' } }],
    select: {
      id: true,
      userId: true,
      sessionId: true,
      enrollmentStatus: true,
      examOutcome: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      session: {
        select: {
          dateDisplayLabel: true,
          formation: {
            select: {
              id: true,
              name: true,
              slug: true,
              courseId: true,
            },
          },
        },
      },
    },
  });

  const courseIds = Array.from(
    new Set(
      participants.map((p) => p.session.formation.courseId).filter((id): id is string => Boolean(id)),
    ),
  );

  const bundlesByCourse = new Map<string, CourseProgressBundle>();
  await Promise.all(
    courseIds.map(async (cid) => {
      const bundle = await loadCourseProgressBundle(cid);
      if (bundle) bundlesByCourse.set(cid, bundle);
    }),
  );

  const rows: InstructorTraineeRow[] = [];

  const participantsByCourse = new Map<string | null, typeof participants>();
  for (const p of participants) {
    const cid = p.session.formation.courseId;
    if (!participantsByCourse.has(cid)) participantsByCourse.set(cid, []);
    participantsByCourse.get(cid)!.push(p);
  }

  const progressByUser = new Map<
    string,
    {
      progressPercent: number;
      completedChapters: number;
      totalChapters: number;
      quizPassed: number;
      quizTotal: number;
      lastActivityAt: Date | null;
    }
  >();

  for (const [courseId, group] of Array.from(participantsByCourse.entries())) {
    const bundle = courseId ? bundlesByCourse.get(courseId) ?? null : null;
    const userIds = group.map((p) => p.userId);
    const map = await computeProgressForUsers(userIds, bundle);
    for (const [uid, val] of Array.from(map.entries())) progressByUser.set(uid, val);
  }

  for (const p of participants) {
    const courseId = p.session.formation.courseId;
    const prog = progressByUser.get(p.userId) ?? {
      progressPercent: 0,
      completedChapters: 0,
      totalChapters: 0,
      quizPassed: 0,
      quizTotal: 0,
      lastActivityAt: null,
    };

    rows.push({
      participantId: p.id,
      userId: p.userId,
      sessionId: p.sessionId,
      sessionLabel: p.session.dateDisplayLabel,
      formationId: p.session.formation.id,
      formationName: p.session.formation.name,
      formationSlug: p.session.formation.slug,
      courseId,
      name: p.user.name,
      email: p.user.email,
      phone: p.user.phone,
      avatar: p.user.avatar,
      enrollmentStatus: p.enrollmentStatus,
      examOutcome: p.examOutcome,
      progressPercent: prog.progressPercent,
      completedChapters: prog.completedChapters,
      totalChapters: prog.totalChapters,
      quizPassed: prog.quizPassed,
      quizTotal: prog.quizTotal,
      lastActivityAt: prog.lastActivityAt?.toISOString() ?? null,
    });
  }

  return rows;
}

export async function getInstructorTraineeDetail(
  trainerUserId: string,
  sessionId: string,
  userId: string,
): Promise<InstructorTraineeDetail | null> {
  const participant = await prisma.formationSessionParticipant.findFirst({
    where: {
      sessionId,
      userId,
      session: { trainerUserId },
    },
    select: {
      id: true,
      enrollmentStatus: true,
      examOutcome: true,
      user: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          birthDate: true,
          city: true,
          postalCode: true,
        },
      },
      candidature: {
        select: { status: true, cnapsReference: true },
      },
      session: {
        select: {
          dateDisplayLabel: true,
          location: true,
          formation: {
            select: { name: true, courseId: true },
          },
        },
      },
    },
  });

  if (!participant) return null;

  const courseId = participant.session.formation.courseId;
  const bundle = await loadCourseProgressBundle(courseId);

  const progressMap = await computeProgressForUsers([userId], bundle);
  const prog = progressMap.get(userId)!;

  let chapters: InstructorTraineeChapterProgress[] = [];
  if (bundle) {
    const doneRows = await prisma.userProgress.findMany({
      where: {
        userId,
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

  let quizzes: InstructorTraineeQuizRow[] = [];
  if (bundle && bundle.quizActivityIds.length > 0) {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId, activityId: { in: bundle.quizActivityIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        activityId: true,
        score: true,
        passed: true,
        createdAt: true,
      },
    });

    const byActivity = new Map<string, typeof attempts>();
    for (const a of attempts) {
      if (!byActivity.has(a.activityId)) byActivity.set(a.activityId, []);
      byActivity.get(a.activityId)!.push(a);
    }

    quizzes = bundle.quizActivityIds.map((activityId) => {
      const meta = bundle.quizById.get(activityId)!;
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
    participantId: participant.id,
    userId,
    sessionId,
    sessionLabel: participant.session.dateDisplayLabel,
    location: participant.session.location,
    formationName: participant.session.formation.name,
    user: {
      name: participant.user.name,
      firstName: participant.user.firstName,
      lastName: participant.user.lastName,
      email: participant.user.email,
      phone: participant.user.phone,
      avatar: participant.user.avatar,
      birthDate: participant.user.birthDate?.toISOString() ?? null,
      city: participant.user.city,
      postalCode: participant.user.postalCode,
    },
    candidature: participant.candidature
      ? {
          status: participant.candidature.status,
          cnapsReference: participant.candidature.cnapsReference,
        }
      : null,
    enrollmentStatus: participant.enrollmentStatus,
    examOutcome: participant.examOutcome,
    progressPercent: prog.progressPercent,
    completedChapters: prog.completedChapters,
    totalChapters: prog.totalChapters,
    chapters,
    quizzes,
    eFormationNote:
      'La session présentielle est la source de vérité. L’e-formation soutient la révision des modules vus en classe.',
  };
}

export async function buildCohortActivity(
  trainerUserId: string,
  sessionId: string,
): Promise<CohortActivityPayload | null> {
  const session = await prisma.formationSession.findFirst({
    where: { id: sessionId, trainerUserId },
    select: {
      formation: { select: { courseId: true } },
      participants: { select: { userId: true } },
    },
  });

  if (!session) return null;

  const userIds = session.participants.map((p) => p.userId);
  const courseId = session.formation.courseId;
  const bundle = await loadCourseProgressBundle(courseId);

  const chapterIds = bundle?.chapterIds ?? [];
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - 29);

  const [progressRows, quizRows] = await Promise.all([
    chapterIds.length && userIds.length
      ? prisma.userProgress.findMany({
          where: {
            userId: { in: userIds },
            isCompleted: true,
            updatedAt: { gte: since },
            chapterId: { in: chapterIds },
          },
          select: { updatedAt: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.quizAttempt.findMany({
          where: {
            userId: { in: userIds },
            passed: true,
            createdAt: { gte: since },
            ...(bundle?.quizActivityIds.length
              ? { activityId: { in: bundle.quizActivityIds } }
              : {}),
          },
          select: { createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const lessonsByDay = new Map<string, number>();
  for (const row of progressRows) {
    const key = dayKey(row.updatedAt);
    lessonsByDay.set(key, (lessonsByDay.get(key) ?? 0) + 1);
  }

  const quizzesByDay = new Map<string, number>();
  for (const row of quizRows) {
    const key = dayKey(row.createdAt);
    quizzesByDay.set(key, (quizzesByDay.get(key) ?? 0) + 1);
  }

  const series: CohortActivityPoint[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - offset);
    const key = dayKey(d);
    series.push({
      date: key,
      label: formatDayLabel(d),
      lessons: lessonsByDay.get(key) ?? 0,
      quizzes: quizzesByDay.get(key) ?? 0,
    });
  }

  const totals = series.reduce(
    (acc, point) => ({
      lessons: acc.lessons + point.lessons,
      quizzes: acc.quizzes + point.quizzes,
    }),
    { lessons: 0, quizzes: 0 },
  );

  return {
    days: 30,
    series,
    totals,
    participantCount: userIds.length,
  };
}

/** Activité LMS agrégée sur tous les stagiaires des sessions du formateur (30 jours). */
export async function buildInstructorGlobalActivity(
  trainerUserId: string,
): Promise<CohortActivityPayload | null> {
  const sessionIds = await listInstructorSessionIds(trainerUserId);
  if (sessionIds.length === 0) return null;

  const participants = await prisma.formationSessionParticipant.findMany({
    where: { sessionId: { in: sessionIds } },
    select: {
      userId: true,
      session: {
        select: {
          formation: { select: { courseId: true } },
        },
      },
    },
  });

  const userIds = Array.from(new Set(participants.map((p) => p.userId)));
  if (userIds.length === 0) return null;

  const courseIds = Array.from(
    new Set(
      participants
        .map((p) => p.session.formation.courseId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const bundles = await Promise.all(courseIds.map((cid) => loadCourseProgressBundle(cid)));
  const chapterIds = bundles.flatMap((b) => b?.chapterIds ?? []);
  const quizActivityIds = bundles.flatMap((b) => b?.quizActivityIds ?? []);

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - 29);

  const [progressRows, quizRows] = await Promise.all([
    chapterIds.length
      ? prisma.userProgress.findMany({
          where: {
            userId: { in: userIds },
            isCompleted: true,
            updatedAt: { gte: since },
            chapterId: { in: chapterIds },
          },
          select: { updatedAt: true },
        })
      : Promise.resolve([]),
    quizActivityIds.length
      ? prisma.quizAttempt.findMany({
          where: {
            userId: { in: userIds },
            passed: true,
            createdAt: { gte: since },
            activityId: { in: quizActivityIds },
          },
          select: { createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const lessonsByDay = new Map<string, number>();
  for (const row of progressRows) {
    const key = dayKey(row.updatedAt);
    lessonsByDay.set(key, (lessonsByDay.get(key) ?? 0) + 1);
  }

  const quizzesByDay = new Map<string, number>();
  for (const row of quizRows) {
    const key = dayKey(row.createdAt);
    quizzesByDay.set(key, (quizzesByDay.get(key) ?? 0) + 1);
  }

  const series: CohortActivityPoint[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - offset);
    const key = dayKey(d);
    series.push({
      date: key,
      label: formatDayLabel(d),
      lessons: lessonsByDay.get(key) ?? 0,
      quizzes: quizzesByDay.get(key) ?? 0,
    });
  }

  const totals = series.reduce(
    (acc, point) => ({
      lessons: acc.lessons + point.lessons,
      quizzes: acc.quizzes + point.quizzes,
    }),
    { lessons: 0, quizzes: 0 },
  );

  return {
    days: 30,
    series,
    totals,
    participantCount: userIds.length,
  };
}

export async function listAttendanceParticipants(sessionId: string, trainerUserId: string) {
  const participants = await prisma.formationSessionParticipant.findMany({
    where: { sessionId, session: { trainerUserId } },
    orderBy: { user: { name: 'asc' } },
    select: {
      user: { select: { name: true, firstName: true, lastName: true, email: true } },
    },
  });

  return participants.map((p, i) => ({
    index: i + 1,
    name:
      p.user.name?.trim() ||
      [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') ||
      p.user.email,
    email: p.user.email,
  }));
}
