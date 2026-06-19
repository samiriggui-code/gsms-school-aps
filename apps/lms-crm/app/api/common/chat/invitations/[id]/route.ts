import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireSessionUserId } from '@/app/api/_shared/topbar-auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

/** Accepter ou refuser une invitation chat. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const invitation = await prisma.chatInvitation.findFirst({
    where: { id, inviteeUserId: auth.userId },
    select: {
      id: true,
      status: true,
      conversationId: true,
      expiresAt: true,
    },
  });

  if (!invitation) return fail('Invitation introuvable.', 404);
  if (invitation.status !== 'PENDING') {
    return fail('Cette invitation a déjà été traitée.', 409);
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await prisma.chatInvitation.update({
      where: { id },
      data: { status: 'CANCELLED', respondedAt: new Date() },
    });
    return fail('Invitation expirée.', 410);
  }

  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const action = String(body.action ?? '').trim().toLowerCase();
  if (action !== 'accept' && action !== 'decline') {
    return fail('action doit être accept ou decline.', 400);
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.chatInvitation.update({
      where: { id },
      data: { status: action === 'decline' ? 'DECLINED' : 'ACCEPTED', respondedAt: now },
    }),
    ...(action === 'accept'
      ? [
          prisma.chatParticipant.upsert({
            where: {
              conversationId_userId: {
                conversationId: invitation.conversationId,
                userId: auth.userId,
              },
            },
            create: {
              conversationId: invitation.conversationId,
              userId: auth.userId,
            },
            update: {},
          }),
          prisma.chatConversation.update({
            where: { id: invitation.conversationId },
            data: { updatedAt: now },
          }),
        ]
      : []),
    prisma.inAppNotification.updateMany({
      where: {
        userId: auth.userId,
        metadata: { path: ['invitationId'], equals: id },
      },
      data: {
        readAt: now,
        archivedAt: action === 'decline' ? now : null,
      },
    }),
  ]);

  if (action === 'decline') {
    return ok({ status: 'DECLINED' });
  }

  return ok({ status: 'ACCEPTED', conversationId: invitation.conversationId });
}
