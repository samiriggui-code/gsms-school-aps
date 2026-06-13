import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter } from '@/lib/portal/lms-access';
import { gradeQuizAttempt } from '@/lib/portal/lms-quiz';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ activityId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { activityId } = await params;
  const { userId, access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  let body: { answers?: Record<string, number> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const answers = body.answers ?? {};
  if (typeof answers !== 'object' || Array.isArray(answers)) {
    return fail('answers invalide.', 400);
  }

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      isPublished: true,
      subType: 'QUIZ_MULTIPLE_CHOICE',
      chapter: { isPublished: true, course: { isPublished: true } },
    },
    select: {
      id: true,
      content: true,
      details: true,
      chapterId: true,
      chapter: {
        select: {
          id: true,
          courseId: true,
          isFree: true,
          isPublished: true,
          position: true,
        },
      },
    },
  });

  if (!activity) return fail('Quiz introuvable.', 404);

  if (primaryCourseId && activity.chapter.courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  if (!canAccessChapter(access, activity.chapter)) {
    return fail('Quiz verrouillé.', 403);
  }

  const graded = gradeQuizAttempt(activity.content, activity.details, answers);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      activityId: activity.id,
      answers,
      score: graded.score,
      passed: graded.passed,
    },
    select: { id: true, score: true, passed: true, createdAt: true },
  });

  if (graded.passed) {
    await prisma.userProgress.upsert({
      where: { userId_chapterId: { userId, chapterId: activity.chapterId } },
      create: { userId, chapterId: activity.chapterId, isCompleted: true },
      update: { isCompleted: true },
    });
  }

  return ok({
    attemptId: attempt.id,
    score: attempt.score,
    passed: attempt.passed,
    passScore: graded.passScore,
    results: graded.results.map((r) => ({
      questionId: r.questionId,
      selectedIndex: r.selectedIndex,
      correct: r.correct,
      correctIndex: r.correctIndex,
    })),
    createdAt: attempt.createdAt.toISOString(),
  });
}
