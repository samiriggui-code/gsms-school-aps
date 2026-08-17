import type { Prisma } from '@repo/database';
import { fail } from '@/app/api/_shared/http/response';
import { displayUserName, requireSessionUserId } from '@/app/api/_shared/topbar-auth';
import { isCrmRole, isInstructorRole, isPortalRole } from '@/lib/auth/app-routing';
import { CHAT_PERMISSION, isSuperAdminRole, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  CHAT_ELIGIBLE_ROLE_SLUGS,
  assertEligibleParticipants,
  isUserChatEligible,
  userHasInternalChatPermission,
} from '@/lib/chat-eligible';
import { prisma } from '@/lib/prisma';

/** Événements adressés nominativement — hors cloisonnement module. */
export const CHAT_SCOPE_BYPASS_ROLES = ['superadmin'] as const;

export async function getUserRhTeamIds(userId: string): Promise<string[]> {
  const [memberships, led] = await Promise.all([
    prisma.rhTeamMember.findMany({
      where: { userId },
      select: { teamId: true },
    }),
    prisma.rhTeam.findMany({
      where: { leaderId: userId },
      select: { id: true },
    }),
  ]);
  return [...new Set([...memberships.map((m) => m.teamId), ...led.map((t) => t.id)])];
}

export async function userBelongsToRhTeam(
  userId: string,
  teamId: string,
  roleSlug?: string | null,
): Promise<boolean> {
  if (isSuperAdminRole(roleSlug)) return true;

  const team = await prisma.rhTeam.findFirst({
    where: {
      id: teamId,
      OR: [{ leaderId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  return Boolean(team);
}

/** Utilisateurs contactables : même équipe RH, co-participants session, ou staff global (superadmin). */
export async function resolveChatContactUserIds(callerId: string, roleSlug: string): Promise<Set<string>> {
  const allowed = new Set<string>();

  if ((CHAT_SCOPE_BYPASS_ROLES as readonly string[]).includes(roleSlug)) {
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        isTrashed: false,
        id: { not: callerId },
        role: { slug: { in: [...CHAT_ELIGIBLE_ROLE_SLUGS] } },
      },
      select: { id: true },
      take: 200,
    });
    for (const u of users) allowed.add(u.id);
    return allowed;
  }

  const teamIds = await getUserRhTeamIds(callerId);
  if (teamIds.length > 0) {
    const members = await prisma.rhTeamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { userId: true },
    });
    const leaders = await prisma.rhTeam.findMany({
      where: { id: { in: teamIds }, leaderId: { not: null } },
      select: { leaderId: true },
    });
    for (const m of members) {
      if (m.userId !== callerId) allowed.add(m.userId);
    }
    for (const l of leaders) {
      if (l.leaderId && l.leaderId !== callerId) allowed.add(l.leaderId);
    }
  }

  const coParticipants = await prisma.chatParticipant.findMany({
    where: {
      userId: callerId,
      conversation: {
        OR: [{ formationSessionId: { not: null } }, { rhTeamId: { not: null } }],
      },
    },
    select: {
      conversation: {
        select: {
          participants: { select: { userId: true } },
        },
      },
    },
  });
  for (const row of coParticipants) {
    for (const p of row.conversation.participants) {
      if (p.userId !== callerId) allowed.add(p.userId);
    }
  }

  return allowed;
}

export async function assertParticipantsInChatScope(
  callerId: string,
  roleSlug: string,
  participantIds: string[],
): Promise<boolean> {
  if (participantIds.length === 0) return true;
  if ((CHAT_SCOPE_BYPASS_ROLES as readonly string[]).includes(roleSlug)) {
    return assertEligibleParticipants(participantIds);
  }

  const allowed = await resolveChatContactUserIds(callerId, roleSlug);
  return participantIds.every((id) => allowed.has(id));
}

export async function requireChatSession() {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth;

  const roleSlug = auth.session.user?.roleSlug ?? '';
  const eligible = await isUserChatEligible(auth.userId);
  if (!eligible) {
    return { error: fail('Chat non autorisé pour ce profil.', 403) };
  }

  if (isPortalRole(roleSlug)) {
    return auth;
  }

  if (
    !isSuperAdminRole(roleSlug) &&
    (isCrmRole(roleSlug) || isInstructorRole(roleSlug)) &&
    !userHasInternalChatPermission(auth.session.user?.permissionSlugs)
  ) {
    return { error: fail('Permission chat interne requise.', 403) };
  }

  return auth;
}

export function chatParticipantsWhere(
  callerId: string,
  roleSlug: string,
  contactIds: Set<string>,
): Prisma.UserWhereInput {
  if ((CHAT_SCOPE_BYPASS_ROLES as readonly string[]).includes(roleSlug)) {
    return {
      status: 'ACTIVE',
      isTrashed: false,
      id: { not: callerId },
      role: { slug: { in: [...CHAT_ELIGIBLE_ROLE_SLUGS] } },
    };
  }

  const ids = [...contactIds];
  if (ids.length === 0) {
    return { id: { in: [] as string[] } };
  }

  return {
    status: 'ACTIVE',
    isTrashed: false,
    id: { in: ids, not: callerId },
    role: { slug: { in: [...CHAT_ELIGIBLE_ROLE_SLUGS] } },
  };
}

export async function fetchScopedChatParticipants(callerId: string, roleSlug: string) {
  const contactIds = await resolveChatContactUserIds(callerId, roleSlug);
  const users = await prisma.user.findMany({
    where: chatParticipantsWhere(callerId, roleSlug, contactIds),
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    take: 80,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: displayUserName(u),
    email: u.email,
    avatar: u.avatar,
  }));
}

export { CHAT_PERMISSION, sessionHasPermission };
