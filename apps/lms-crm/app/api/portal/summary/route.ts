import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter, lmsAccessLabel } from '@/lib/portal/lms-access';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { userId, access, candidature, roleSlug, sessionStartsAt } = auth.ctx;
  const courseId = candidature?.formation?.courseId ?? null;

  let chapterCount = 0;
  let accessibleCount = 0;
  let completedCount = 0;

  if (courseId) {
    const chapters = await prisma.chapter.findMany({
      where: { courseId, isPublished: true },
      select: { id: true, isFree: true, isPublished: true },
    });
    chapterCount = chapters.length;
    accessibleCount = chapters.filter((ch) => canAccessChapter(access, ch)).length;

    if (chapters.length > 0) {
      const done = await prisma.userProgress.count({
        where: {
          userId,
          isCompleted: true,
          chapterId: { in: chapters.map((c) => c.id) },
        },
      });
      completedCount = done;
    }
  }

  return ok({
    tier: access.tier,
    tierLabel: lmsAccessLabel(access.tier),
    sessionStartsAt: sessionStartsAt?.toISOString() ?? null,
    roleSlug,
    formation: candidature?.formation ?? null,
    candidatureStatus: candidature?.status ?? null,
    stats: {
      chapterCount,
      accessibleChapterCount: accessibleCount,
      completedChapterCount: completedCount,
      progressPercent:
        chapterCount > 0 ? Math.round((completedCount / chapterCount) * 100) : 0,
    },
  });
}
