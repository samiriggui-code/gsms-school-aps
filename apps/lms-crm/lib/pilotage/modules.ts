export type PilotageModuleId =
  | 'all'
  | 'gestion-ressources'
  | 'gestion-academique'
  | 'administration-facturation'
  | 'communication-contenu'
  | 'support-qualite'
  | 'securite-configuration';

export type PilotageModuleTab = {
  id: PilotageModuleId;
  label: string;
  /** Préfixe moduleKey notifications (null = tous) */
  moduleKeyPrefix: string | null;
  enabled: boolean;
  hint?: string;
};

export const PILOTAGE_MODULE_TABS: PilotageModuleTab[] = [
  { id: 'all', label: 'Tous les modules', moduleKeyPrefix: null, enabled: true },
  {
    id: 'gestion-ressources',
    label: 'Gestion ressources',
    moduleKeyPrefix: 'gestion-ressources',
    enabled: true,
  },
  {
    id: 'gestion-academique',
    label: 'Gestion académique',
    moduleKeyPrefix: 'gestion-academique',
    enabled: true,
  },
  {
    id: 'administration-facturation',
    label: 'Admin facturation',
    moduleKeyPrefix: 'administration-facturation',
    enabled: true,
  },
  {
    id: 'support-qualite',
    label: 'Support',
    moduleKeyPrefix: 'support-qualite',
    enabled: true,
  },
  {
    id: 'communication-contenu',
    label: 'Communication',
    moduleKeyPrefix: 'communication-contenu',
    enabled: true,
  },
  {
    id: 'securite-configuration',
    label: 'Sécurité',
    moduleKeyPrefix: 'securite-configuration',
    enabled: true,
  },
];

export type PilotagePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export const PILOTAGE_PERIOD_OPTIONS: { id: PilotagePeriod; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Année' },
];

export function moduleLabelFromKey(moduleKey: string | null | undefined): string {
  if (!moduleKey) return 'Système';
  if (moduleKey.startsWith('gestion-ressources')) return 'Gestion ressources';
  if (moduleKey.startsWith('gestion-academique')) return 'Gestion académique';
  if (moduleKey.startsWith('administration-facturation')) return 'Admin facturation';
  if (moduleKey.startsWith('pilotage-supervision')) return 'Pilotage';
  if (moduleKey.startsWith('support-qualite')) return 'Support';
  if (moduleKey.startsWith('communication-contenu')) return 'Communication & contenu';
  if (moduleKey.startsWith('securite-configuration')) return 'Sécurité & configuration';
  return moduleKey;
}

export function moduleHrefFromKey(moduleKey: string | null | undefined): string {
  if (!moduleKey) return '/accueil';
  if (moduleKey.startsWith('gestion-ressources.qualiopi')) return '/gestion-ressources/qualiopi';
  if (moduleKey.startsWith('gestion-ressources.rh')) return '/gestion-ressources/rh';
  if (moduleKey.startsWith('gestion-ressources.equipements')) return '/gestion-ressources/equipements';
  if (moduleKey.startsWith('gestion-ressources')) return '/gestion-ressources';
  if (moduleKey.startsWith('gestion-academique.suivi-formations'))
    return '/gestion-academique/suivi-formations';
  if (moduleKey.startsWith('gestion-academique')) return '/gestion-academique';
  if (moduleKey.startsWith('administration-facturation')) return '/administration-facturation';
  if (moduleKey.startsWith('pilotage-supervision.ia')) return '/pilotage-supervision/ia';
  if (moduleKey.startsWith('pilotage-supervision')) return '/pilotage-supervision';
  if (moduleKey.startsWith('support-qualite')) return '/support-qualite';
  if (moduleKey.startsWith('communication-contenu')) return '/communication-contenu';
  if (moduleKey.startsWith('securite-configuration')) return '/securite-configuration';
  return '/accueil';
}
