import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter, chapterLockReason } from '@/lib/portal/lms-access';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await params;
  const { userId, access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  if (primaryCourseId && courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      formationCatalog: {
        select: { slug: true, name: true, duration: true, tag: true },
      },
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          isFree: true,
          isPublished: true,
          description: true,
          _count: { select: { activities: { where: { isPublished: true } } } },
        },
      },
    },
  });

  if (!course) return fail('Cours introuvable.', 404);

  const progressRows = await prisma.userProgress.findMany({
    where: {
      userId,
      chapterId: { in: course.chapters.map((c) => c.id) },
      isCompleted: true,
    },
    select: { chapterId: true },
  });
  const completedIds = new Set(progressRows.map((p) => p.chapterId));

  const chapters = course.chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    position: ch.position,
    description: ch.description,
    isFree: ch.isFree,
    activityCount: ch._count.activities,
    accessible: canAccessChapter(access, ch),
    lockReason: chapterLockReason(access, ch),
    completed: completedIds.has(ch.id),
  }));

  const completedCount = chapters.filter((c) => c.completed).length;

  return ok({
    tier: access.tier,
    sessionStartsAt: auth.ctx.sessionStartsAt?.toISOString() ?? null,
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      formation: course.formationCatalog,
      chapterCount: chapters.length,
      completedChapterCount: completedCount,
      progressPercent:
        chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0,
      chapters,
    },
  });
}
