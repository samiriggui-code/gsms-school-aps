import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireNotificationsSession } from '@/app/api/_shared/topbar-auth';

type RouteParams = { params: Promise<{ id: string }> };

function readMeta(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireNotificationsSession();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const existing = await prisma.inAppNotification.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!existing) {
    return fail('Notification introuvable', 404);
  }

  const replyText = typeof body.reply === 'string' ? body.reply.trim() : '';
  if (replyText) {
    const meta = readMeta(existing.metadata);
    const conversationId =
      typeof meta.conversationId === 'string' ? meta.conversationId : null;

    if (conversationId) {
      const participant = await prisma.chatParticipant.findFirst({
        where: { conversationId, userId: auth.userId },
        select: { id: true },
      });
      if (!participant) {
        return fail('Vous ne participez pas à cette conversation.', 403);
      }
      await prisma.chatMessage.create({
        data: {
          conversationId,
          senderId: auth.userId,
          body: replyText,
        },
      });
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    const now = new Date();
    const updated = await prisma.inAppNotification.update({
      where: { id },
      data: {
        readAt: now,
        metadata: {
          ...meta,
          lastReply: replyText,
          repliedAt: now.toISOString(),
        },
      },
    });

    return ok({
      id: updated.id,
      readAt: updated.readAt?.toISOString() ?? null,
      replied: true,
      conversationId,
    });
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
