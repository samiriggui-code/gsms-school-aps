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
  supportEdit: 'crm.support.edit',
  securiteView: 'crm.securite.view',
  securiteEdit: 'crm.securite.edit',
  pilotageView: 'crm.pilotage.view',
} as const;

export const IAM_PERMISSION = {
  usersView: 'iam.users.view',
  usersCreate: 'iam.users.create',
  usersEdit: 'iam.users.edit',
  usersDelete: 'iam.users.delete',
  rolesView: 'iam.roles.view',
  rolesEdit: 'iam.roles.edit',
  permissionsView: 'iam.permissions.view',
  logsView: 'iam.logs.view',
} as const;

export const GOVERNANCE_PERMISSION = {
  storageAdmin: 'governance.storage.admin',
  conformiteView: 'governance.conformite.view',
  auditView: 'governance.audit.view',
} as const;

export const LMS_PERMISSION = {
  courseView: 'lms.course.view',
  courseProgress: 'lms.course.progress',
  contentDraft: 'lms.content.draft',
  contentSubmitReview: 'lms.content.submit_review',
  contentReview: 'lms.content.review',
  contentPublish: 'lms.content.publish',
  quizAuthor: 'lms.quiz.author',
  quizCorrect: 'lms.quiz.correct',
  quizValidate: 'lms.quiz.validate',
  catalogManage: 'lms.catalog.manage',
  analyticsView: 'lms.analytics.view',
} as const;

export const CHAT_PERMISSION = {
  internalAccess: 'chat.internal.access',
  sessionParticipate: 'chat.session.participate',
  sessionModerate: 'chat.session.moderate',
} as const;

export const PORTAL_PERMISSION = {
  mobileAccess: 'portal.mobile.access',
  documentsOwn: 'portal.documents.own',
  settingsOwn: 'portal.settings.own',
} as const;

export type CrmPermissionSlug = (typeof CRM_PERMISSION)[keyof typeof CRM_PERMISSION];
export type LmsPermissionSlug = (typeof LMS_PERMISSION)[keyof typeof LMS_PERMISSION];

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

export function sessionHasAnyPermission(
  session: Session | null | undefined,
  slugs: string[],
): boolean {
  if (!session?.user) return false;
  if (isSuperAdminRole(session.user.roleSlug)) return true;
  return hasAnyPermissionSlug(session.user.permissionSlugs, slugs);
}
