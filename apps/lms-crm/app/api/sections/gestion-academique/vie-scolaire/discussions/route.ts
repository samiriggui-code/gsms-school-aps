import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { LMS_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

/** LMS-02 — liste des discussions (modération staff). */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, LMS_PERMISSION.courseView)) return fail('Forbidden', 403);

  const url = new URL(request.url);
  const courseId = url.searchParams.get('courseId')?.trim() || undefined;

  try {
    const discussions = await prisma.discussion.findMany({
      where: courseId
        ? { community: { courseId } }
        : undefined,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
      include: {
        author: { select: { id: true, name: true, email: true } },
        community: {
          select: {
            id: true,
            name: true,
            course: { select: { id: true, title: true } },
          },
        },
        _count: { select: { comments: true, votes: true } },
      },
    });

    return ok({
      discussions: discussions.map((d) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        label: d.label,
        isPinned: d.isPinned,
        isLocked: d.isLocked,
        authorName: d.author.name ?? d.author.email,
        communityName: d.community.name,
        courseId: d.community.course?.id ?? null,
        courseTitle: d.community.course?.title ?? null,
        commentCount: d._count.comments,
        voteCount: d._count.votes,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[discussions] GET', e);
    return fail('Failed to list discussions', 500);
  }
}
