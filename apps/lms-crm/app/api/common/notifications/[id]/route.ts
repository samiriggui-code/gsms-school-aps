import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireSessionUserId } from '@/app/api/_shared/topbar-auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const existing = await prisma.inAppNotification.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return fail('Notification introuvable', 404);
  }

  const data: { readAt?: Date; archivedAt?: Date } = {};
  if (body.read === true) data.readAt = new Date();
  if (body.archive === true) {
    data.archivedAt = new Date();
    data.readAt = data.readAt ?? new Date();
  }

  const updated = await prisma.inAppNotification.update({
    where: { id },
    data,
  });

  return ok({
    id: updated.id,
    readAt: updated.readAt?.toISOString() ?? null,
    archivedAt: updated.archivedAt?.toISOString() ?? null,
  });
}
