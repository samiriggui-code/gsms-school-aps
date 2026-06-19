import {
  ChatConversationType,
  ChatParticipantRole,
  type Prisma,
  type PrismaClient,
} from '@repo/database';
import { buildSessionTeamDisplayName, ensureSessionTeam } from '@repo/api-core';
import { CHAT_PERMISSION } from '@/lib/auth/crm-permissions';

type Db = PrismaClient | Prisma.TransactionClient;

async function findDefaultModeratorUserId(db: Db): Promise<string | null> {
  const user = await db.user.findFirst({
    where: {
      status: 'ACTIVE',
      isTrashed: false,
      role: {
        permissions: {
          some: { permission: { slug: CHAT_PERMISSION.sessionModerate } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function assertModeratorEligible(db: Db, userId: string): Promise<boolean> {
  const n = await db.user.count({
    where: {
      id: userId,
      status: 'ACTIVE',
      isTrashed: false,
      role: {
        permissions: {
          some: { permission: { slug: CHAT_PERMISSION.sessionModerate } },
        },
      },
    },
  });
  return n === 1;
}

/**
 * Crée ou synchronise le groupe chat d'une session :
 * formateur (TRAINER) + élèves (MEMBER) + modérateur pédagogique (MODERATOR).
 */
export async function ensureSessionChat(
  db: Db,
  sessionId: string,
  options?: { moderatorUserId?: string | null },
): Promise<string | null> {
  const session = await db.formationSession.findUnique({
    where: { id: sessionId },
    include: {
      formation: { select: { name: true } },
      participants: { select: { userId: true } },
      chatConversation: { select: { id: true } },
    },
  });

  if (!session) return null;

  await ensureSessionTeam(db, sessionId, options);

  const sessionAfterTeam = await db.formationSession.findUnique({
    where: { id: sessionId },
    include: {
      formation: { select: { name: true } },
      participants: { select: { userId: true } },
      chatConversation: { select: { id: true } },
    },
  });

  if (!sessionAfterTeam) return null;

  let moderatorUserId = options?.moderatorUserId ?? session.moderatorUserId;
  if (moderatorUserId && !(await assertModeratorEligible(db, moderatorUserId))) {
    moderatorUserId = null;
  }
  if (!moderatorUserId) {
    moderatorUserId = await findDefaultModeratorUserId(db);
    if (moderatorUserId) {
      await db.formationSession.update({
        where: { id: sessionId },
        data: { moderatorUserId },
      });
    }
  }

  const title = buildSessionTeamDisplayName(sessionAfterTeam);

  let conversationId = sessionAfterTeam.chatConversation?.id;

  if (!conversationId) {
    const conv = await db.chatConversation.create({
      data: {
        type: ChatConversationType.GROUP,
        title,
        formationSessionId: sessionId,
      },
    });
    conversationId = conv.id;
  } else if (title) {
    await db.chatConversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  const participantMap = new Map<string, ChatParticipantRole>();

  if (sessionAfterTeam.trainerUserId) {
    participantMap.set(sessionAfterTeam.trainerUserId, ChatParticipantRole.TRAINER);
  }

  if (moderatorUserId) {
    participantMap.set(moderatorUserId, ChatParticipantRole.MODERATOR);
  }

  for (const p of sessionAfterTeam.participants) {
    if (!participantMap.has(p.userId)) {
      participantMap.set(p.userId, ChatParticipantRole.MEMBER);
    }
  }

  for (const [userId, role] of participantMap) {
    await db.chatParticipant.upsert({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      create: { conversationId, userId, role },
      update: { role },
    });
  }

  const rhTeam = await db.rhTeam.findUnique({
    where: { formationSessionId: sessionId },
    select: { id: true },
  });
  if (rhTeam?.id) {
    await db.chatConversation.update({
      where: { id: conversationId },
      data: { rhTeamId: rhTeam.id },
    });
  }

  return conversationId;
}

/** Retire du chat les participants absents de la session (hors formateur / modérateur). */
export async function pruneStaleSessionChatParticipants(
  db: Db,
  sessionId: string,
): Promise<void> {
  const session = await db.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      trainerUserId: true,
      moderatorUserId: true,
      participants: { select: { userId: true } },
      chatConversation: { select: { id: true } },
    },
  });

  if (!session?.chatConversation?.id) return;

  const conversationId = session.chatConversation.id;
  const keepIds = new Set<string>(
    [
      session.trainerUserId,
      session.moderatorUserId,
      ...session.participants.map((p) => p.userId),
    ].filter((id): id is string => Boolean(id)),
  );

  const existing = await db.chatParticipant.findMany({
    where: { conversationId },
    select: { id: true, userId: true, role: true },
  });

  for (const p of existing) {
    if (keepIds.has(p.userId)) continue;
    if (
      p.role === ChatParticipantRole.MODERATOR ||
      p.role === ChatParticipantRole.TRAINER
    ) {
      continue;
    }
    await db.chatParticipant.delete({ where: { id: p.id } });
  }
}

/** Retire les participants absents de la session (hors modérateur / formateur). */
export async function syncSessionChatParticipants(
  db: Db,
  sessionId: string,
): Promise<void> {
  await pruneStaleSessionChatParticipants(db, sessionId);
  await ensureSessionChat(db, sessionId);
}
