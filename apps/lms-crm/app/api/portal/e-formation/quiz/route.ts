import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter, canAccessQuiz, chapterLockReason } from '@/lib/portal/lms-access';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

async function latestQuizAttempts(userId: string, activityIds: string[]) {
  if (activityIds.length === 0) return new Map<string, { score: number; passed: boolean; createdAt: Date }>();

  const rows = await prisma.quizAttempt.findMany({
    where: { userId, activityId: { in: activityIds } },
    orderBy: { createdAt: 'desc' },
    select: { activityId: true, score: true, passed: true, createdAt: true },
  });

  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.activityId)) latest.set(row.activityId, row);
  }
  return latest;
}

export async function GET() {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { userId, access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;
  if (!primaryCourseId) {
    return ok({ courseId: null, modules: [], summary: { total: 0, unlocked: 0, passed: 0 } });
  }

  const course = await prisma.course.findFirst({
    where: { id: primaryCourseId, isPublished: true },
    select: {
      id: true,
      title: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          isFree: true,
          isPublished: true,
          activities: {
            where: { isPublished: true, subType: 'QUIZ_MULTIPLE_CHOICE' },
            orderBy: { position: 'asc' },
            select: { id: true, name: true, position: true },
          },
        },
      },
    },
  });

  if (!course) {
    return ok({ courseId: null, modules: [], summary: { total: 0, unlocked: 0, passed: 0 } });
  }

  const chapterIds = course.chapters.map((c) => c.id);
  const quizIds = course.chapters.flatMap((c) => c.activities.map((a) => a.id));

  const [progressRows, attemptMap] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, chapterId: { in: chapterIds }, isCompleted: true },
      select: { chapterId: true },
    }),
    latestQuizAttempts(userId, quizIds),
  ]);

  const completedIds = new Set(progressRows.map((p) => p.chapterId));

  let totalQuizzes = 0;
  let unlockedQuizzes = 0;
  let passedQuizzes = 0;

  const modules = course.chapters.map((ch, index) => {
    const accessible = canAccessChapter(access, ch);
    const completed = completedIds.has(ch.id);
    const prevChapter = index > 0 ? course.chapters[index - 1] : null;
    const prevQuizActivity = prevChapter?.activities[0];
    const prevAttempt = prevQuizActivity ? attemptMap.get(prevQuizActivity.id) : null;

    const quizzes = ch.activities.map((activity) => {
      totalQuizzes += 1;
      const attempt = attemptMap.get(activity.id);
      const quizAccess = canAccessQuiz(ch, {
        chapterAccessible: accessible,
        chapterCompleted: completed,
        previousChapterCompleted: prevChapter ? completedIds.has(prevChapter.id) : true,
        previousQuizPassed: prevAttempt?.passed ?? index === 0,
      });

      if (quizAccess.unlocked) unlockedQuizzes += 1;
      if (attempt?.passed) passedQuizzes += 1;

      return {
        id: activity.id,
        name: activity.name,
        unlocked: quizAccess.unlocked,
        lockReason: quizAccess.reason,
        attempt: attempt
          ? { score: attempt.score, passed: attempt.passed, createdAt: attempt.createdAt.toISOString() }
          : null,
      };
    });

    return {
      id: ch.id,
      title: ch.title,
      position: ch.position,
      isFree: ch.isFree,
      accessible,
      completed,
      lockReason: chapterLockReason(access, ch),
      quizzes,
    };
  });

  return ok({
    courseId: course.id,
    courseTitle: course.title,
    sessionStartsAt: auth.ctx.sessionStartsAt?.toISOString() ?? null,
    tier: access.tier,
    modules,
    summary: { total: totalQuizzes, unlocked: unlockedQuizzes, passed: passedQuizzes },
  });
}
