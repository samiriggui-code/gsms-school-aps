import { eFormationModulePath } from '@/lib/portal/e-formation-paths';
import { prisma } from '@/lib/prisma';

export async function loadPortalLearningEvents(userId: string, courseId: string | null) {
  if (!courseId) {
    return { progressEvents: [], quizEvents: [] };
  }

  const [progressRows, quizRows] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, isCompleted: true, chapter: { courseId } },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        updatedAt: true,
        chapter: { select: { id: true, title: true, position: true } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        userId,
        passed: true,
        activity: { chapter: { courseId } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        score: true,
        createdAt: true,
        activity: {
          select: {
            name: true,
            chapter: { select: { id: true, title: true } },
          },
        },
      },
    }),
  ]);

  return {
    progressEvents: progressRows.map((p) => ({
      id: `prog-${p.id}`,
      action: 'UV terminée',
      target: p.chapter.title,
      detail: `Module ${p.chapter.position}`,
      at: p.updatedAt,
      href: eFormationModulePath(courseId, p.chapter.id),
    })),
    quizEvents: quizRows.map((q) => ({
      id: `quiz-${q.id}`,
      action: 'Quiz réussi',
      target: q.activity.name || q.activity.chapter.title,
      detail: `${q.score} %`,
      at: q.createdAt,
      href: eFormationModulePath(courseId, q.activity.chapter.id),
    })),
  };
}
