import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter, chapterLockReason } from '@/lib/portal/lms-access';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { userId, access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      ...(primaryCourseId ? { id: primaryCourseId } : {}),
    },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          isFree: true,
          isPublished: true,
        },
      },
      enrollments: {
        where: { userId },
        select: { id: true, status: true },
        take: 1,
      },
    },
  });

  const progressRows = await prisma.userProgress.findMany({
    where: {
      userId,
      chapterId: { in: courses.flatMap((c) => c.chapters.map((ch) => ch.id)) },
      isCompleted: true,
    },
    select: { chapterId: true },
  });
  const completedIds = new Set(progressRows.map((p) => p.chapterId));

  const data = courses.map((course) => {
    const chapters = course.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      position: ch.position,
      isFree: ch.isFree,
      accessible: canAccessChapter(access, ch),
      lockReason: chapterLockReason(access, ch),
      completed: completedIds.has(ch.id),
    }));
    const accessibleCount = chapters.filter((c) => c.accessible).length;
    const completedCount = chapters.filter((c) => c.completed).length;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      enrollmentStatus: course.enrollments[0]?.status ?? null,
      chapterCount: chapters.length,
      accessibleChapterCount: accessibleCount,
      completedChapterCount: completedCount,
      progressPercent:
        chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0,
      locked: access.tier === 'none' || accessibleCount === 0,
      isPrimary: course.id === primaryCourseId,
      chapters,
    };
  });

  return ok({
    tier: access.tier,
    sessionStartsAt: auth.ctx.sessionStartsAt?.toISOString() ?? null,
    formation: candidature?.formation ?? null,
    courses: data,
  });
}
