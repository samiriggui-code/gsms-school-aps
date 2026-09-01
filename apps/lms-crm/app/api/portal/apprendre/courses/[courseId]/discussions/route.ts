import { ok, fail } from '@/app/api/_shared/http/response';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ courseId: string }> };

async function ensureCourseCommunity(courseId: string) {
  let community = await prisma.community.findFirst({
    where: { courseId },
    select: { id: true, name: true },
  });
  if (community) return community;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });
  if (!course) return null;

  community = await prisma.community.create({
    data: {
      name: `Communauté — ${course.title}`,
      courseId: course.id,
    },
    select: { id: true, name: true },
  });
  return community;
}

/** GET — discussions du cours (lecture). */
export async function GET(_request: Request, { params }: Ctx) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await params;
  const { userId, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  if (primaryCourseId && courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  const community = await prisma.community.findFirst({
    where: { courseId },
    select: { id: true },
  });
  if (!community) return ok({ discussions: [] });

  const discussions = await prisma.discussion.findMany({
    where: { communityId: community.id, isLocked: false },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    take: 50,
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  return ok({
    discussions: discussions.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      isPinned: d.isPinned,
      authorName: d.author.name,
      isOwn: d.authorId === userId,
      commentCount: d._count.comments,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

/** POST — créer une discussion (apprenant). */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await params;
  const { userId, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  if (primaryCourseId && courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  let body: { title?: string; content?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const title = body.title?.trim();
  if (!title) return fail('title requis', 400);

  const community = await ensureCourseCommunity(courseId);
  if (!community) return fail('Cours introuvable.', 404);

  const discussion = await prisma.discussion.create({
    data: {
      title,
      content: body.content?.trim() || null,
      authorId: userId,
      communityId: community.id,
    },
    select: { id: true, title: true, createdAt: true },
  });

  return ok({ discussion }, 201);
}
