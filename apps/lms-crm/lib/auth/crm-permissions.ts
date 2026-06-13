import type { Session } from 'next-auth';

/** Permissions CRM — slugs alignés sur `packages/database/prisma/data/permissions.js`. */
export const CRM_PERMISSION = {
  dashboard: 'crm.dashboard.view',
  ressourcesView: 'crm.ressources.view',
  ressourcesEdit: 'crm.ressources.edit',
  academiqueView: 'crm.academique.view',
  academiqueEdit: 'crm.academique.edit',
  financeView: 'crm.finance.view',
  financeEdit: 'crm.finance.edit',
  communicationView: 'crm.communication.view',
  communicationEdit: 'crm.communication.edit',
  supportView: 'crm.support.view',
  securiteView: 'crm.securite.view',
  securiteEdit: 'crm.securite.edit',
  pilotageView: 'crm.pilotage.view',
} as const;

export type CrmPermissionSlug = (typeof CRM_PERMISSION)[keyof typeof CRM_PERMISSION];

export function isSuperAdminRole(roleSlug: string | null | undefined): boolean {
  return roleSlug === 'superadmin';
}

export function hasPermissionSlug(
  permissionSlugs: ReadonlySet<string> | string[] | null | undefined,
  slug: string,
): boolean {
  if (!permissionSlugs) return false;
  if (permissionSlugs instanceof Set) return permissionSlugs.has(slug);
  if (Array.isArray(permissionSlugs)) return permissionSlugs.includes(slug);
  return false;
}

export function hasAnyPermissionSlug(
  permissionSlugs: ReadonlySet<string> | string[] | null | undefined,
  slugs: string[],
): boolean {
  return slugs.some((slug) => hasPermissionSlug(permissionSlugs, slug));
}

/** Vérifie une permission à partir de la session NextAuth (safe côté client). */
export function sessionHasPermission(
  session: Session | null | undefined,
  slug: string,
): boolean {
  if (!session?.user) return false;
  if (isSuperAdminRole(session.user.roleSlug)) return true;
  return hasPermissionSlug(session.user.permissionSlugs, slug);
}
