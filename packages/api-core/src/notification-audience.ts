import type { CrmEventAudience, InAppNotificationCategory } from '@repo/database';
import type { CrmModuleKey } from './crm-events';

/** Permission CRM requise pour voir les alertes d’un préfixe module (metadata.moduleKey). */
export const NOTIFICATION_MODULE_PERMISSIONS: Record<string, string> = {
  'gestion-ressources': 'crm.ressources.view',
  'gestion-academique': 'crm.academique.view',
  'administration-facturation': 'crm.finance.view',
  'communication-contenu': 'crm.communication.view',
  'support-qualite': 'crm.support.view',
  'pilotage-supervision': 'crm.pilotage.view',
  'securite-configuration': 'crm.securite.view',
};

export type NotificationAudiencePreset = {
  audience: CrmEventAudience;
  roleSlugs?: string[];
  permissionSlugs?: string[];
};

/** Rôles portail / métier hors broadcast CRM global. */
export const PORTAL_NOTIFICATION_ROLE_SLUGS = ['formateur', 'candidat', 'eleve'] as const;

export const CRM_STAFF_ROLE_SLUGS = [
  'superadmin',
  'admin',
  'collaborateur',
  'manager',
  'staff',
  'support',
] as const;

export function permissionForModuleKey(moduleKey: string | null | undefined): string | null {
  if (!moduleKey) return 'crm.dashboard.view';
  const prefix = Object.keys(NOTIFICATION_MODULE_PERMISSIONS).find(
    (key) => moduleKey === key || moduleKey.startsWith(`${key}.`),
  );
  return prefix ? NOTIFICATION_MODULE_PERMISSIONS[prefix] : 'crm.dashboard.view';
}

export function canViewModuleNotifications(
  moduleKey: string | null | undefined,
  permissionSlugs: ReadonlySet<string> | string[],
): boolean {
  const slugs = permissionSlugs instanceof Set ? permissionSlugs : new Set(permissionSlugs);
  if (slugs.has('settings.manage')) return true;
  const required = permissionForModuleKey(moduleKey);
  return required ? slugs.has(required) : true;
}

/** Audience par défaut selon module / catégorie — évite le broadcast à tous les utilisateurs actifs. */
export function defaultAudienceForEvent(
  moduleKey: CrmModuleKey | string,
  category: InAppNotificationCategory,
): NotificationAudiencePreset {
  const permission = permissionForModuleKey(moduleKey);
  if (permission) {
    return { audience: 'PERMISSION_SLUGS', permissionSlugs: [permission] };
  }

  if (category === 'FINANCE') {
    return { audience: 'PERMISSION_SLUGS', permissionSlugs: ['crm.finance.view'] };
  }
  if (category === 'TICKET') {
    return { audience: 'PERMISSION_SLUGS', permissionSlugs: ['crm.support.view'] };
  }
  if (category === 'ACADEMIC' || category === 'TEAM') {
    return { audience: 'PERMISSION_SLUGS', permissionSlugs: ['crm.academique.view'] };
  }

  return { audience: 'PERMISSION_SLUGS', permissionSlugs: ['crm.dashboard.view'] };
}

export type PilotageModulePermissionRow = {
  moduleId: string;
  label: string;
  permissionSlug: string;
  moduleKeyPrefix: string;
};

export const PILOTAGE_ALERT_MODULE_PERMISSIONS: PilotageModulePermissionRow[] = [
  {
    moduleId: 'gestion-ressources',
    label: 'Gestion ressources',
    permissionSlug: 'crm.ressources.view',
    moduleKeyPrefix: 'gestion-ressources',
  },
  {
    moduleId: 'gestion-academique',
    label: 'Gestion académique',
    permissionSlug: 'crm.academique.view',
    moduleKeyPrefix: 'gestion-academique',
  },
  {
    moduleId: 'administration-facturation',
    label: 'Admin facturation',
    permissionSlug: 'crm.finance.view',
    moduleKeyPrefix: 'administration-facturation',
  },
  {
    moduleId: 'support-qualite',
    label: 'Support qualité',
    permissionSlug: 'crm.support.view',
    moduleKeyPrefix: 'support-qualite',
  },
  {
    moduleId: 'pilotage-supervision',
    label: 'Pilotage supervision',
    permissionSlug: 'crm.pilotage.view',
    moduleKeyPrefix: 'pilotage-supervision',
  },
];
