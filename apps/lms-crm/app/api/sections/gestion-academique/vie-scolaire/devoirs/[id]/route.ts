import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { LMS_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type RouteParams = { params: Promise<{ id: string }> };

/** GET — détail devoir + soumissions. */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, LMS_PERMISSION.courseView)) return fail('Forbidden', 403);

  const { id } = await params;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        activity: {
          select: {
            name: true,
            chapter: {
              select: {
                title: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
        submissions: {
          orderBy: { updatedAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!assignment) return fail('Assignment not found', 404);

    return ok({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate?.toISOString() ?? null,
        maxPoints: assignment.maxPoints,
        courseTitle: assignment.activity.chapter.course.title,
        chapterTitle: assignment.activity.chapter.title,
        submissions: assignment.submissions.map((s) => ({
          id: s.id,
          userId: s.userId,
          userName: s.user.name ?? s.user.email,
          content: s.content,
          fileUrl: s.fileUrl,
          grade: s.grade,
          feedback: s.feedback,
          updatedAt: s.updatedAt.toISOString(),
        })),
      },
    });
  } catch (e) {
    console.error('[devoirs/id] GET', e);
    return fail('Failed to load assignment', 500);
  }
}

/** DELETE — supprimer un devoir (staff review). */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, LMS_PERMISSION.contentReview)) return fail('Forbidden', 403);

  const { id } = await params;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { activityId: true },
    });
    if (!assignment) return fail('Assignment not found', 404);

    await prisma.$transaction([
      prisma.assignment.delete({ where: { id } }),
      prisma.activity.delete({ where: { id: assignment.activityId } }),
    ]);

    return ok({ deleted: true });
  } catch (e) {
    console.error('[devoirs/id] DELETE', e);
    return fail('Failed to delete assignment', 500);
  }
}
