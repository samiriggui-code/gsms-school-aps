/** Blocs configurables sur les landings de modules CRM (ModuleSetting layout). */
export const MODULE_LANDING_WIDGET_CATALOG = {
  'finance-landing': [
    { id: 'stats', label: 'KPIs finance' },
    { id: 'welcome', label: 'Bandeau bienvenue' },
    { id: 'charts', label: 'Graphiques évolution / répartition' },
    { id: 'alerts', label: 'Alertes conformité' },
    { id: 'operations', label: 'Table opérations récentes' },
  ],
  'pilotage-landing': [
    { id: 'stats', label: 'Indicateurs pilotage' },
    { id: 'welcome', label: 'Bandeau bienvenue' },
    { id: 'module-tabs', label: 'Onglets alertes / indicateurs / rapports' },
  ],
  'support-landing': [
    { id: 'stats', label: 'KPIs support' },
    { id: 'welcome', label: 'Bandeau bienvenue' },
    { id: 'menu-cards', label: 'Raccourcis tickets / incidents' },
  ],
  'gestion-ressources-landing': [
    { id: 'stats', label: 'KPIs ressources' },
    { id: 'welcome', label: 'Bandeau bienvenue' },
    { id: 'menu-cards', label: 'Raccourcis RH / équipements' },
  ],
  'communication-landing': [
    { id: 'stats', label: 'KPIs communication' },
    { id: 'welcome', label: 'Bandeau bienvenue' },
    { id: 'menu-cards', label: 'Raccourcis CMS / marketing / SEO' },
  ],
  'vie-scolaire-landing': [
    { id: 'stats', label: 'KPIs vie scolaire' },
    { id: 'welcome', label: 'Bandeau bienvenue' },
    { id: 'menu-cards', label: 'Raccourcis formations / sessions / étudiants' },
  ],
} as const;

export type ModuleLandingKey = keyof typeof MODULE_LANDING_WIDGET_CATALOG;

export function defaultModuleLandingLayout(moduleKey: ModuleLandingKey): string[] {
  return MODULE_LANDING_WIDGET_CATALOG[moduleKey].map((w) => w.id);
}
