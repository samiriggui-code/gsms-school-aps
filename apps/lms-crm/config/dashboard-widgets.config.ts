import { MODULE_LANDING_WIDGET_CATALOG } from './module-landing-widgets.config';

export const DASHBOARD_WIDGET_CATALOG = {
  'crm-dashboard': [
    { id: 'kpis', label: 'Indicateurs clés (KPIs)' },
    { id: 'highlights', label: 'Alertes & priorités' },
    { id: 'welcome', label: 'Bandeau de bienvenue' },
    { id: 'menu-cards', label: 'Raccourcis modules' },
  ],
  'formateur-dashboard': [
    { id: 'sessions', label: 'Prochaines sessions' },
    { id: 'learners', label: 'Stagiaires actifs' },
    { id: 'tasks', label: 'Tâches pédagogiques' },
  ],
  'stagiaire-dashboard': [
    { id: 'parcours', label: 'Mon parcours' },
    { id: 'documents', label: 'Documents & dossier' },
    { id: 'planning', label: 'Planning sessions' },
  ],
} as const;

export const LAYOUT_WIDGET_CATALOG = {
  ...DASHBOARD_WIDGET_CATALOG,
  ...MODULE_LANDING_WIDGET_CATALOG,
} as const;

export type DashboardModuleKey = keyof typeof DASHBOARD_WIDGET_CATALOG;
export type LayoutModuleKey = keyof typeof LAYOUT_WIDGET_CATALOG;

export function defaultDashboardLayout(moduleKey: DashboardModuleKey): string[] {
  return DASHBOARD_WIDGET_CATALOG[moduleKey].map((w) => w.id);
}

export function defaultLayoutWidgets(moduleKey: LayoutModuleKey): string[] {
  return LAYOUT_WIDGET_CATALOG[moduleKey].map((w) => w.id);
}
