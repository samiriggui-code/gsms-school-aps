import { prisma } from '@/lib/prisma';
import { CHAT_PERMISSION } from '@/lib/auth/crm-permissions';

/** Rôles autorisés dans le chat interne CRM / formateur. */
export const CHAT_ELIGIBLE_ROLE_SLUGS = [
  'superadmin',
  'admin',
  'collaborateur',
  'formateur',
] as const;

export type ChatEligibleRoleSlug = (typeof CHAT_ELIGIBLE_ROLE_SLUGS)[number];

const PORTAL_CHAT_ROLE_SLUGS = ['eleve', 'candidat'] as const;

/** Vérifie l'éligibilité chat : staff/formateur OU apprenant inscrit à une session avec chat. */
export async function isUserChatEligible(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
      isTrashed: true,
      role: { select: { slug: true } },
    },
  });

  if (!user || user.status !== 'ACTIVE' || user.isTrashed) return false;

  const slug = user.role?.slug ?? '';
  if ((CHAT_ELIGIBLE_ROLE_SLUGS as readonly string[]).includes(slug)) return true;

  if ((PORTAL_CHAT_ROLE_SLUGS as readonly string[]).includes(slug)) {
    const sessionChatCount = await prisma.formationSessionParticipant.count({
      where: {
        userId,
        session: { chatConversation: { isNot: null } },
      },
    });
    return sessionChatCount > 0;
  }

  return false;
}

export async function assertEligibleParticipants(participantIds: string[]): Promise<boolean> {
  if (participantIds.length === 0) return true;
  const results = await Promise.all(participantIds.map((id) => isUserChatEligible(id)));
  return results.every(Boolean);
}

export function userHasInternalChatPermission(
  permissionSlugs: ReadonlySet<string> | string[] | null | undefined,
): boolean {
  const slugs = permissionSlugs instanceof Set ? permissionSlugs : new Set(permissionSlugs ?? []);
  return (
    slugs.has(CHAT_PERMISSION.internalAccess) ||
    slugs.has(CHAT_PERMISSION.sessionParticipate) ||
    slugs.has(CHAT_PERMISSION.sessionModerate)
  );
}
