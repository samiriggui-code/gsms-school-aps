import { getServerSession } from 'next-auth/next';
import { EnrollmentStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

/** G12 — admin inscriptions LMS (Prisma Enrollment / DocType LmsEnrollment). */

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId')?.trim() || undefined;
  const statusParam = searchParams.get('status')?.trim();
  const status =
    statusParam && Object.values(EnrollmentStatus).includes(statusParam as EnrollmentStatus)
      ? (statusParam as EnrollmentStatus)
      : undefined;

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, firstName: true, lastName: true } },
        course: {
          select: {
            id: true,
            title: true,
            _count: { select: { chapters: true } },
          },
        },
        session: { select: { id: true, title: true } },
      },
    });

    const progressByKey = new Map<string, number>();
    if (enrollments.length > 0) {
      const pairs = enrollments.map((e) => ({ userId: e.userId, courseId: e.courseId }));
      const uniqueCourseIds = [...new Set(pairs.map((p) => p.courseId))];
      const chapters = await prisma.chapter.findMany({
        where: { courseId: { in: uniqueCourseIds } },
        select: { id: true, courseId: true },
      });
      const chapterIdsByCourse = new Map<string, string[]>();
      for (const ch of chapters) {
        const list = chapterIdsByCourse.get(ch.courseId) ?? [];
        list.push(ch.id);
        chapterIdsByCourse.set(ch.courseId, list);
      }
      const allChapterIds = chapters.map((c) => c.id);
      const userIds = [...new Set(pairs.map((p) => p.userId))];
      const completed =
        allChapterIds.length === 0
          ? []
          : await prisma.userProgress.findMany({
              where: {
                userId: { in: userIds },
                chapterId: { in: allChapterIds },
                isCompleted: true,
              },
              select: { userId: true, chapterId: true },
            });
      const chapterToCourse = new Map(chapters.map((c) => [c.id, c.courseId]));
      for (const row of completed) {
        const cId = chapterToCourse.get(row.chapterId);
        if (!cId) continue;
        const key = `${row.userId}:${cId}`;
        progressByKey.set(key, (progressByKey.get(key) ?? 0) + 1);
      }
    }

    const byStatus = await prisma.enrollment.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return ok({
      total: enrollments.length,
      statusCounts: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count._all]),
      ) as Record<string, number>,
      enrollments: enrollments.map((e) => {
        const chapterTotal = e.course._count.chapters;
        const completedCount = progressByKey.get(`${e.userId}:${e.courseId}`) ?? 0;
        const progressPct =
          chapterTotal > 0 ? Math.round((completedCount / chapterTotal) * 100) : null;
        return {
          id: e.id,
          status: e.status,
          notes: e.notes,
          userId: e.userId,
          userLabel:
            e.user.name ||
            [e.user.firstName, e.user.lastName].filter(Boolean).join(' ') ||
            e.user.email,
          userEmail: e.user.email,
          courseId: e.courseId,
          courseTitle: e.course.title,
          sessionId: e.sessionId,
          sessionTitle: e.session?.title ?? null,
          chapterTotal,
          chaptersCompleted: completedCount,
          progressPct,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        };
      }),
    });
  } catch (e) {
    console.error('[inscriptions-lms] GET', e);
    return fail('Failed to list LMS enrollments', 500);
  }
}
