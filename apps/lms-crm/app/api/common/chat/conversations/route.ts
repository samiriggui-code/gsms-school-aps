import { NextRequest } from 'next/server';
import { ChatConversationType } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { displayUserName, requireSessionUserId } from '@/app/api/_shared/topbar-auth';

export async function GET() {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const participations = await prisma.chatParticipant.findMany({
    where: { userId: auth.userId },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  });

  const conversations = participations.map(({ conversation, lastReadAt }) => {
    const lastMessage = conversation.messages[0] ?? null;
    const unread =
      !!lastMessage &&
      lastMessage.senderId !== auth.userId &&
      (!lastReadAt || lastMessage.createdAt > lastReadAt);

    const participantNames = conversation.participants
      .filter((p) => p.userId !== auth.userId)
      .map((p) => displayUserName(p.user))
      .join(', ');

    let title = conversation.title;
    if (!title) {
      title = participantNames.length > 0 ? participantNames : 'Conversation';
    }

    return {
      id: conversation.id,
      type: conversation.type,
      title,
      updatedAt: conversation.updatedAt.toISOString(),
      unread,
      participants: conversation.participants.map((p) => ({
        id: p.user.id,
        name: displayUserName(p.user),
        avatar: p.user.avatar,
      })),
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            body: lastMessage.body,
            createdAt: lastMessage.createdAt.toISOString(),
            senderName: displayUserName(lastMessage.sender),
            isMine: lastMessage.senderId === auth.userId,
          }
        : null,
    };
  });

  return ok({ conversations });
}

export async function POST(request: NextRequest) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const typeRaw = String(body.type ?? 'GROUP').toUpperCase();
  const type =
    typeRaw === 'DIRECT' ? ChatConversationType.DIRECT : ChatConversationType.GROUP;
  const title = body.title ? String(body.title).trim() : null;
  const participantIds = Array.isArray(body.participantIds)
    ? (body.participantIds as string[]).filter((id) => id && id !== auth.userId)
    : [];

  const allParticipantIds = [...new Set([auth.userId, ...participantIds])];
  if (allParticipantIds.length < 2) {
    return fail('Au moins un autre participant est requis.', 400);
  }

  if (type === ChatConversationType.DIRECT && allParticipantIds.length !== 2) {
    return fail('Une conversation directe requiert exactement deux participants.', 400);
  }

  try {
    if (type === ChatConversationType.DIRECT) {
      const [a, b] = allParticipantIds;
      const existing = await prisma.chatConversation.findFirst({
        where: {
          type: ChatConversationType.DIRECT,
          AND: [
            { participants: { some: { userId: a } } },
            { participants: { some: { userId: b } } },
          ],
        },
        select: { id: true },
      });
      if (existing) return ok({ id: existing.id, existing: true });
    }

    const conv = await prisma.chatConversation.create({
      data: {
        type,
        title: type === ChatConversationType.GROUP ? title || 'Conversation' : null,
        participants: {
          create: allParticipantIds.map((userId) => ({ userId })),
        },
      },
      select: { id: true },
    });

    return ok({ id: conv.id, existing: false }, 201);
  } catch (error) {
    return fail('Impossible de créer la conversation.', 500, error);
  }
}
