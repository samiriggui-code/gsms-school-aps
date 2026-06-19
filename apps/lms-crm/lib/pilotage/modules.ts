export type PilotageModuleId =
  | 'all'
  | 'gestion-ressources'
  | 'gestion-academique'
  | 'administration-facturation'
  | 'support-qualite';

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
    label: 'Support qualité',
    moduleKeyPrefix: 'support-qualite',
    enabled: true,
  },
];

export type PilotagePeriod = 'day' | 'week' | 'month' | 'year';

export const PILOTAGE_PERIOD_OPTIONS: { id: PilotagePeriod; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
];

export function moduleLabelFromKey(moduleKey: string | null | undefined): string {
  if (!moduleKey) return 'Système';
  if (moduleKey.startsWith('gestion-ressources')) return 'Gestion ressources';
  if (moduleKey.startsWith('gestion-academique')) return 'Gestion académique';
  if (moduleKey.startsWith('administration-facturation')) return 'Admin facturation';
  if (moduleKey.startsWith('pilotage-supervision')) return 'Pilotage';
  if (moduleKey.startsWith('support-qualite')) return 'Support qualité';
  return moduleKey;
}

export function moduleHrefFromKey(moduleKey: string | null | undefined): string {
  if (!moduleKey) return '/accueil';
  if (moduleKey.startsWith('gestion-ressources.rh')) return '/gestion-ressources/rh';
  if (moduleKey.startsWith('gestion-ressources.equipements')) return '/gestion-ressources/equipements';
  if (moduleKey.startsWith('gestion-ressources')) return '/gestion-ressources';
  if (moduleKey.startsWith('gestion-academique')) return '/gestion-academique';
  if (moduleKey.startsWith('administration-facturation')) return '/administration-facturation';
  if (moduleKey.startsWith('support-qualite')) return '/support-qualite';
  return '/accueil';
}
