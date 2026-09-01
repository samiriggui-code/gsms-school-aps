import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { LMS_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type RouteParams = { params: Promise<{ id: string }> };

/** PATCH — modération (pin / lock). */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, LMS_PERMISSION.contentReview)) return fail('Forbidden', 403);

  const { id } = await params;

  let body: { isPinned?: boolean; isLocked?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  if (body.isPinned === undefined && body.isLocked === undefined) {
    return fail('isPinned or isLocked required', 400);
  }

  try {
    const updated = await prisma.discussion.update({
      where: { id },
      data: {
        ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
        ...(body.isLocked !== undefined ? { isLocked: body.isLocked } : {}),
      },
      select: { id: true, isPinned: true, isLocked: true },
    });
    return ok({ discussion: updated });
  } catch (e) {
    console.error('[discussions/id] PATCH', e);
    return fail('Failed to update discussion', 500);
  }
}

/** DELETE — supprimer une discussion (modération). */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, LMS_PERMISSION.contentReview)) return fail('Forbidden', 403);

  const { id } = await params;

  try {
    await prisma.discussion.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    console.error('[discussions/id] DELETE', e);
    return fail('Failed to delete discussion', 500);
  }
}
