import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { displayUserName, requireSessionUserId } from '@/app/api/_shared/topbar-auth';

type RouteParams = { params: Promise<{ id: string }> };

async function assertParticipant(userId: string, conversationId: string) {
  return prisma.chatParticipant.findFirst({
    where: { userId, conversationId },
  });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const { id: conversationId } = await params;
  const participant = await assertParticipant(auth.userId, conversationId);
  if (!participant) return fail('Conversation introuvable', 404);

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      sender: {
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
  });

  await prisma.chatParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return ok({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      isMine: m.senderId === auth.userId,
      sender: {
        id: m.sender.id,
        name: displayUserName(m.sender),
        avatar: m.sender.avatar,
      },
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const { id: conversationId } = await params;
  const participant = await assertParticipant(auth.userId, conversationId);
  if (!participant) return fail('Conversation introuvable', 404);

  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return fail('Message vide', 400);
  if (text.length > 4000) return fail('Message trop long', 400);

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: auth.userId,
      body: text,
    },
    include: {
      sender: {
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
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return ok({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      isMine: true,
      sender: {
        id: message.sender.id,
        name: displayUserName(message.sender),
        avatar: message.sender.avatar,
      },
    },
  });
}
