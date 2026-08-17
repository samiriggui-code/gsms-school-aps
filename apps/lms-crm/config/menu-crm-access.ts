import type { MenuItem } from '@/config/types';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

/** Préfixe de chemin → permission CRM (match le plus long gagnant). */
const PATH_PERMISSION_PREFIXES: { prefix: string; permissionSlug: string }[] = [
  { prefix: '/accueil', permissionSlug: CRM_PERMISSION.dashboard },
  { prefix: '/gestion-ressources', permissionSlug: CRM_PERMISSION.ressourcesView },
  { prefix: '/gestion-academique', permissionSlug: CRM_PERMISSION.academiqueView },
  { prefix: '/administration-facturation', permissionSlug: CRM_PERMISSION.financeView },
  { prefix: '/communication-contenu', permissionSlug: CRM_PERMISSION.communicationView },
  { prefix: '/support-qualite', permissionSlug: CRM_PERMISSION.supportView },
  { prefix: '/pilotage-supervision', permissionSlug: CRM_PERMISSION.pilotageView },
  { prefix: '/securite-configuration', permissionSlug: CRM_PERMISSION.securiteView },
  { prefix: '/account', permissionSlug: CRM_PERMISSION.dashboard },
  { prefix: '/mon-profil', permissionSlug: CRM_PERMISSION.dashboard },
];

export function crmPermissionForPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  let best: { prefix: string; permissionSlug: string } | undefined;
  for (const entry of PATH_PERMISSION_PREFIXES) {
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) {
      if (!best || entry.prefix.length > best.prefix.length) {
        best = entry;
      }
    }
  }
  return best?.permissionSlug;
}

function applyToItem(item: MenuItem): MenuItem {
  if (item.heading) return item;

  const permissionSlug = item.permissionSlug ?? crmPermissionForPath(item.path);
  const next: MenuItem = permissionSlug ? { ...item, permissionSlug } : { ...item };

  if (item.children?.length) {
    next.children = item.children.map(applyToItem);
  }

  return next;
}

/** Injecte les `permissionSlug` CRM sur le menu sidebar avant filtrage. */
export function applyCrmMenuAccess(items: MenuItem[]): MenuItem[] {
  return items.map(applyToItem);
}
