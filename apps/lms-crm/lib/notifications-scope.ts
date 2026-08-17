import type { InAppNotificationChannel, Prisma } from '@repo/database';
import {
  NOTIFICATION_MODULE_PERMISSIONS,
  canViewModuleNotifications,
} from '@repo/api-core/notification-audience';
import { NOTIFICATION_CHANNELS } from '@repo/api-core/notification-channel';
import type { WorkspaceAccountKind } from '@/config/workspace-settings.config';
import {
  isCrmRole,
  isInstructorRole,
  isPortalRole,
} from '@/lib/auth/app-routing';

/** Périmètre des notifications in-app selon l'espace (CRM / formateur / stagiaire). */
export type NotificationsScope = WorkspaceAccountKind;

export const NOTIFICATIONS_VIEW_PERMISSION = 'in_app_notifications.view';

export type NotificationChannelFilter = InAppNotificationChannel;

/** Canaux visibles par espace — modèle UX simplifié (Phase G). */
export const SCOPE_NOTIFICATION_CHANNELS: Record<
  NotificationsScope,
  readonly NotificationChannelFilter[]
> = {
  'crm-user': NOTIFICATION_CHANNELS,
  formateur: ['PEDAGOGIE', 'DOSSIER'],
  stagiaire: ['DOSSIER', 'PEDAGOGIE'],
};

/** @deprecated Préférer `scopeNotificationChannels` — conservé pour compat filtres legacy. */
export const CRM_NOTIFICATION_CATEGORIES = [
  'SYSTEM',
  'TICKET',
  'FINANCE',
  'ACADEMIC',
  'TEAM',
] as const;

/** @deprecated */
export const WORKSPACE_NOTIFICATION_CATEGORIES = [
  'ACADEMIC',
  'TEAM',
  'TICKET',
] as const;

export function scopeNotificationChannels(
  scope: NotificationsScope,
): readonly NotificationChannelFilter[] {
  return SCOPE_NOTIFICATION_CHANNELS[scope];
}

/** Filtre Prisma par canal UX selon l'espace connecté. */
export function buildNotificationScopeWhere(
  scope: NotificationsScope,
): Prisma.InAppNotificationWhereInput {
  const channels = scopeNotificationChannels(scope);
  return { channel: { in: [...channels] } };
}

/** @deprecated Utiliser scopeNotificationChannels */
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

/** Préfixes moduleKey autorisés selon les permissions session (CRM). */
export function allowedModuleKeyPrefixes(
  permissionSlugs: ReadonlySet<string> | string[] | null | undefined,
): string[] {
  const slugs = permissionSlugs instanceof Set ? permissionSlugs : new Set(permissionSlugs ?? []);
  if (slugs.has('settings.manage')) {
    return Object.keys(NOTIFICATION_MODULE_PERMISSIONS);
  }
  return Object.entries(NOTIFICATION_MODULE_PERMISSIONS)
    .filter(([, perm]) => slugs.has(perm))
    .map(([prefix]) => prefix);
}

export function filterNotificationItemsByModulePermission<
  T extends { moduleKey?: string | null; eventType?: string | null },
>(items: T[], permissionSlugs: ReadonlySet<string> | string[] | null | undefined): T[] {
  return items.filter((item) =>
    canViewNotificationRow(item.moduleKey ?? null, item.eventType ?? null, permissionSlugs ?? []),
  );
}

/** Notifications nominatives (équipe, chat) toujours visibles pour le destinataire. */
const PERSONAL_NOTIFICATION_EVENTS = new Set([
  'rh.team.member_added',
  'chat.invitation',
  'report.completed',
  'report.failed',
]);

export function canViewNotificationRow(
  moduleKey: string | null | undefined,
  eventType: string | null | undefined,
  permissionSlugs: ReadonlySet<string> | string[],
): boolean {
  if (eventType && PERSONAL_NOTIFICATION_EVENTS.has(eventType)) return true;
  return canViewModuleNotifications(moduleKey, permissionSlugs);
}

export function moduleKeyFromNotificationMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const mk = (metadata as Record<string, unknown>).moduleKey;
  return typeof mk === 'string' ? mk : null;
}

export function eventTypeFromNotificationMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const et = (metadata as Record<string, unknown>).eventType;
  return typeof et === 'string' ? et : null;
}

/** Filtre Prisma — cloisonnement modules CRM (lecture). */
export function buildModulePermissionWhere(
  scope: NotificationsScope,
  permissionSlugs: ReadonlySet<string> | string[] | null | undefined,
): Prisma.InAppNotificationWhereInput {
  if (scope !== 'crm-user') return {};

  const slugs = permissionSlugs instanceof Set ? permissionSlugs : new Set(permissionSlugs ?? []);
  if (slugs.has('settings.manage')) return {};

  const prefixes = allowedModuleKeyPrefixes(slugs);
  const allPrefixes = Object.keys(NOTIFICATION_MODULE_PERMISSIONS);
  if (prefixes.length >= allPrefixes.length) return {};
  if (prefixes.length === 0) {
    return {
      OR: PERSONAL_NOTIFICATION_EVENTS.size
        ? [...PERSONAL_NOTIFICATION_EVENTS].map((eventType) => ({
            metadata: { path: ['eventType'], equals: eventType },
          }))
        : [{ id: { in: [] as string[] } }],
    };
  }

  const or: Prisma.InAppNotificationWhereInput[] = [];
  for (const prefix of prefixes) {
    or.push({ metadata: { path: ['moduleKey'], equals: prefix } });
    or.push({ metadata: { path: ['moduleKey'], string_starts_with: `${prefix}.` } });
  }

  for (const eventType of PERSONAL_NOTIFICATION_EVENTS) {
    or.push({ metadata: { path: ['eventType'], equals: eventType } });
  }

  if (slugs.has('crm.dashboard.view')) {
    or.push({ category: 'SYSTEM' });
  }

  return { OR: or };
}

export { NOTIFICATION_MODULE_PERMISSIONS, canViewModuleNotifications };
