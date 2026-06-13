import type { Prisma } from '@repo/database';
import type { WorkspaceAccountKind } from '@/config/workspace-settings.config';
import {
  isCrmRole,
  isInstructorRole,
  isPortalRole,
} from '@/lib/auth/app-routing';

/** Périmètre des notifications in-app selon l'espace (CRM / formateur / stagiaire). */
export type NotificationsScope = WorkspaceAccountKind;

export const NOTIFICATIONS_VIEW_PERMISSION = 'in_app_notifications.view';

/** Catégories visibles dans l'UI filtre — hors admin / finance pour espaces métier. */
export const CRM_NOTIFICATION_CATEGORIES = [
  'SYSTEM',
  'TICKET',
  'FINANCE',
  'ACADEMIC',
  'TEAM',
] as const;

export const WORKSPACE_NOTIFICATION_CATEGORIES = [
  'ACADEMIC',
  'TEAM',
  'TICKET',
] as const;

const ADMIN_HREF_BLOCKS = [
  '/administration-facturation',
  '/securite-configuration',
  '/communication-contenu/marketing/formulaires-leads',
] as const;

function hrefExclusionWhere(): Prisma.InAppNotificationWhereInput {
  return {
    NOT: {
      OR: [
        ...ADMIN_HREF_BLOCKS.map((prefix) => ({ href: { startsWith: prefix } })),
        { href: { contains: '/devis' } },
        { href: { contains: '/finance/' } },
      ],
    },
  };
}

/** Filtre Prisma : alertes métier uniquement (pas admin CRM, finance, devis). */
export function buildNotificationScopeWhere(
  scope: NotificationsScope,
): Prisma.InAppNotificationWhereInput {
  if (scope === 'crm-user') {
    return {};
  }

  if (scope === 'formateur') {
    return {
      AND: [
        {
          OR: [
            { category: { in: ['ACADEMIC', 'TEAM'] } },
            {
              category: 'TICKET',
              OR: [
                { href: { startsWith: '/support-qualite' } },
                { href: { startsWith: '/formateur' } },
                { href: { startsWith: '/gestion-academique' } },
                { metadata: { path: ['moduleKey'], string_starts_with: 'portal-' } },
                { metadata: { path: ['eventType'], string_starts_with: 'learner.' } },
              ],
            },
          ],
        },
        { category: { notIn: ['SYSTEM', 'FINANCE'] } },
        hrefExclusionWhere(),
      ],
    };
  }

  // stagiaire — dossier, formation, support, messages établissement
  return {
    AND: [
      { category: { in: ['ACADEMIC', 'TEAM', 'TICKET'] } },
      { category: { notIn: ['SYSTEM', 'FINANCE'] } },
      hrefExclusionWhere(),
    ],
  };
}

export function scopeNotificationCategories(
  scope: NotificationsScope,
): readonly string[] {
  return scope === 'crm-user'
    ? CRM_NOTIFICATION_CATEGORIES
    : WORKSPACE_NOTIFICATION_CATEGORIES;
}

export function scopeFromPathname(pathname: string): NotificationsScope {
  if (pathname.startsWith('/formateur')) return 'formateur';
  if (
    pathname.startsWith('/mon-dossier') ||
    pathname.startsWith('/formation') ||
    pathname.startsWith('/e-formation')
  ) {
    return 'stagiaire';
  }
  return 'crm-user';
}

export function scopeFromRoleSlug(
  roleSlug: string | null | undefined,
): NotificationsScope {
  if (isInstructorRole(roleSlug)) return 'formateur';
  if (isPortalRole(roleSlug)) return 'stagiaire';
  return 'crm-user';
}

/** Scope effectif : le rôle session prime ; le paramètre client ne peut pas élargir le périmètre. */
export function resolveNotificationsScope(
  roleSlug: string | null | undefined,
  requested?: string | null,
): NotificationsScope {
  const roleScope = scopeFromRoleSlug(roleSlug);
  if (!requested) return roleScope;
  if (requested === roleScope) return roleScope;
  if (requested === 'crm-user' && isCrmRole(roleSlug) && !isInstructorRole(roleSlug)) {
    return 'crm-user';
  }
  return roleScope;
}

export function startOfTodayUtc(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
