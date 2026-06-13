import type { WorkspaceAccountKind } from '@/config/workspace-settings.config';

/** Page complète historique + stats notifications in-app, par espace. */
export const NOTIFICATIONS_HUB_PATH: Record<WorkspaceAccountKind, string> = {
  'crm-user': '/account/notifications',
  formateur: '/formateur/notifications',
  stagiaire: '/mon-dossier/notifications',
};

/** Résout la page hub depuis l’URL courante (header cloche, liens contextuels). */
export function resolveNotificationsHubPath(pathname: string): string {
  if (pathname.startsWith('/formateur')) {
    return NOTIFICATIONS_HUB_PATH.formateur;
  }
  if (
    pathname.startsWith('/mon-dossier') ||
    pathname.startsWith('/formation') ||
    pathname.startsWith('/e-formation')
  ) {
    return NOTIFICATIONS_HUB_PATH.stagiaire;
  }
  return NOTIFICATIONS_HUB_PATH['crm-user'];
}
