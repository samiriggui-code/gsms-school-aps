import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { displayUserName, requireSessionUserId } from '@/app/api/_shared/topbar-auth';
import { enrichNotificationMetadata } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { CHAT_ELIGIBLE_ROLE_SLUGS } from '@/lib/chat-eligible';
import { isCrmRole, isInstructorRole } from '@/lib/auth/app-routing';

function assertChatAccess(roleSlug: string) {
  return isCrmRole(roleSlug) || isInstructorRole(roleSlug);
}

async function assertEligibleUserIds(userIds: string[]) {
  if (userIds.length === 0) return true;
  const count = await prisma.user.count({
    where: {
      id: { in: userIds },
      status: 'ACTIVE',
      role: { slug: { in: [...CHAT_ELIGIBLE_ROLE_SLUGS] } },
    },
  });
  return count === userIds.length;
}

/** Invitations chat en attente pour l'utilisateur connecté. */
export async function GET() {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;
  if (!assertChatAccess(auth.session.user?.roleSlug ?? '')) {
    return fail('Accès chat non autorisé pour ce profil.', 403);
  }

  const rows = await prisma.chatInvitation.findMany({
    where: { inviteeUserId: auth.userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      conversation: {
        select: {
          id: true,
          title: true,
          type: true,
          rhTeam: { select: { id: true, name: true } },
        },
      },
      invitedBy: {
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

  return ok({
    invitations: rows.map((row) => ({
      id: row.id,
      status: row.status,
      message: row.message,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      conversation: {
        id: row.conversation.id,
        title:
          row.conversation.title ??
          row.conversation.rhTeam?.name ??
          'Conversation',
        type: row.conversation.type,
        teamName: row.conversation.rhTeam?.name ?? null,
      },
      invitedBy: {
        id: row.invitedBy.id,
        name: displayUserName(row.invitedBy),
        avatar: row.invitedBy.avatar,
      },
    })),
  });
}

/** Crée des invitations (utilisateurs et/ou équipe RH). */
export async function POST(request: NextRequest) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;
  if (!assertChatAccess(auth.session.user?.roleSlug ?? '')) {
    return fail('Accès chat non autorisé pour ce profil.', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const conversationId = String(body.conversationId ?? '').trim();
  if (!conversationId) return fail('conversationId requis.', 400);

  const conversation = await prisma.chatConversation.findFirst({
    where: { id: conversationId },
    include: {
      participants: { select: { userId: true } },
      rhTeam: { select: { id: true, name: true } },
    },
  });
  if (!conversation) return fail('Conversation introuvable.', 404);

  const isParticipant = conversation.participants.some((p) => p.userId === auth.userId);
  if (!isParticipant) return fail('Vous devez participer à la conversation pour inviter.', 403);

  const participantSet = new Set(conversation.participants.map((p) => p.userId));
  const inviteeIds = new Set<string>();

  if (Array.isArray(body.userIds)) {
    for (const raw of body.userIds) {
      const id = String(raw ?? '').trim();
      if (id && id !== auth.userId && !participantSet.has(id)) inviteeIds.add(id);
    }
  }

  const teamId = body.teamId ? String(body.teamId).trim() : '';
  if (teamId) {
    const members = await prisma.rhTeamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });
    for (const member of members) {
      if (member.userId !== auth.userId && !participantSet.has(member.userId)) {
        inviteeIds.add(member.userId);
      }
    }
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { rhTeamId: teamId },
    });
  }

  const targetIds = Array.from(inviteeIds);
  if (targetIds.length === 0) {
    return fail('Aucun participant éligible à inviter.', 400);
  }

  if (!(await assertEligibleUserIds(targetIds))) {
    return fail('Un ou plusieurs utilisateurs ne sont pas éligibles au chat.', 403);
  }

  const message = body.message ? String(body.message).trim() : null;
  const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;

  const inviter = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  });
  const inviterName = inviter ? displayUserName(inviter) : 'Un collaborateur';
  const conversationTitle =
    conversation.title ??
    conversation.rhTeam?.name ??
    'Conversation';

  const created = await prisma.$transaction(async (tx) => {
    const rows = await Promise.all(
      targetIds.map((inviteeUserId) =>
        tx.chatInvitation.upsert({
          where: {
            conversationId_inviteeUserId: { conversationId, inviteeUserId },
          },
          create: {
            conversationId,
            inviteeUserId,
            invitedById: auth.userId,
            message,
            expiresAt,
          },
          update: {
            status: 'PENDING',
            invitedById: auth.userId,
            message,
            expiresAt,
            respondedAt: null,
          },
          select: { id: true, inviteeUserId: true },
        }),
      ),
    );

    for (const row of rows) {
      const metadata = await enrichNotificationMetadata(tx, 'TEAM', {
        moduleKey: 'communication-contenu',
        eventType: 'chat.invitation',
        actionType: 'chat_invitation',
        invitationId: row.id,
        conversationId,
        conversationTitle,
        teamName: conversation.rhTeam?.name ?? null,
        actorId: inviter?.id ?? auth.userId,
        actorUserId: inviter?.id ?? auth.userId,
        actorName: inviterName,
        actorAvatar: inviter?.avatar ?? null,
        severity: 'INFO',
      });

      await tx.inAppNotification.create({
        data: {
          userId: row.inviteeUserId,
          category: 'TEAM',
          title: `${inviterName} vous invite au chat`,
          body:
            message ??
            `Rejoignez la conversation « ${conversationTitle} ».`,
          href: null,
          metadata,
        },
      });
    }

    return rows;
  });

  return ok({ created: created.length, invitationIds: created.map((c) => c.id) }, 201);
}
