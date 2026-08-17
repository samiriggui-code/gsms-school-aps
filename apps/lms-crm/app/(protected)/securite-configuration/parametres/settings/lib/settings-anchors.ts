export const SETTINGS_BASE_PATH = '/securite-configuration/parametres/settings';

export const SETTINGS_ANCHOR_IDS = {
  general: 'settings_general',
  administrativeDossier: 'settings_administrative_dossier',
  etablissement: 'settings_etablissement',
  legal: 'settings_legal',
  formation: 'settings_formation',
  dirigeant: 'settings_dirigeant',
  registre: 'settings_registre',
  notifications: 'settings_notifications',
  social: 'settings_social',
  integrations: 'settings_integrations',
  dashboard: 'settings_dashboard',
  modules: 'settings_modules',
  workspacePages: 'settings_workspace_pages',
} as const;

export type SettingsAnchorId =
  (typeof SETTINGS_ANCHOR_IDS)[keyof typeof SETTINGS_ANCHOR_IDS];

export type SettingsScrollspyItem = {
  titleKey: string;
  titleFallback: string;
  target: SettingsAnchorId;
  active?: boolean;
};

export type SettingsScrollspyGroup = {
  titleKey: string;
  titleFallback: string;
  items: SettingsScrollspyItem[];
};

const platformItems: SettingsScrollspyItem[] = [
  {
    titleKey: 'pages.settings.sidebar.general',
    titleFallback: 'Général',
    target: SETTINGS_ANCHOR_IDS.general,
    active: true,
  },
  {
    titleKey: 'pages.settings.sidebar.administrativeDossier',
    titleFallback: 'Dossier administratif',
    target: SETTINGS_ANCHOR_IDS.administrativeDossier,
  },
  {
    titleKey: 'pages.settings.sidebar.etablissement',
    titleFallback: 'Établissement',
    target: SETTINGS_ANCHOR_IDS.etablissement,
  },
  {
    titleKey: 'pages.settings.sidebar.legal',
    titleFallback: 'Identité légale',
    target: SETTINGS_ANCHOR_IDS.legal,
  },
  {
    titleKey: 'pages.settings.sidebar.formation',
    titleFallback: 'Formation & conformité',
    target: SETTINGS_ANCHOR_IDS.formation,
  },
  {
    titleKey: 'pages.settings.sidebar.dirigeant',
    titleFallback: 'Dirigeant',
    target: SETTINGS_ANCHOR_IDS.dirigeant,
  },
  {
    titleKey: 'pages.settings.sidebar.registre',
    titleFallback: 'Registre INPI',
    target: SETTINGS_ANCHOR_IDS.registre,
  },
  {
    titleKey: 'pages.settings.sidebar.notifications',
    titleFallback: 'Notifications',
    target: SETTINGS_ANCHOR_IDS.notifications,
  },
  {
    titleKey: 'pages.settings.sidebar.social',
    titleFallback: 'Réseaux sociaux',
    target: SETTINGS_ANCHOR_IDS.social,
  },
  {
    titleKey: 'pages.settings.sidebar.integrations',
    titleFallback: 'Intégrations',
    target: SETTINGS_ANCHOR_IDS.integrations,
  },
];

export const SETTINGS_SCROLLSPY_GROUPS: SettingsScrollspyGroup[] = [
  {
    titleKey: 'pages.settings.sidebar.group.platform',
    titleFallback: 'Établissement & plateforme',
    items: platformItems,
  },
  {
    titleKey: 'pages.settings.sidebar.group.spaces',
    titleFallback: 'Espaces utilisateurs',
    items: [
      {
        titleKey: 'pages.settings.sidebar.dashboard',
        titleFallback: 'Layouts dashboard',
        target: SETTINGS_ANCHOR_IDS.dashboard,
      },
    ],
  },
  {
    titleKey: 'pages.settings.sidebar.group.modules',
    titleFallback: 'Modules CRM',
    items: [
      {
        titleKey: 'pages.settings.sidebar.modules',
        titleFallback: 'Paramètres métier',
        target: SETTINGS_ANCHOR_IDS.modules,
      },
    ],
  },
  {
    titleKey: 'pages.settings.sidebar.group.pages',
    titleFallback: 'Pages & espaces',
    items: [
      {
        titleKey: 'pages.settings.sidebar.workspacePages',
        titleFallback: 'Réglages par page',
        target: SETTINGS_ANCHOR_IDS.workspacePages,
      },
    ],
  },
];

export const SETTINGS_SCROLLSPY_ITEMS: SettingsScrollspyItem[] =
  SETTINGS_SCROLLSPY_GROUPS.flatMap((g) => g.items);

export const SETTINGS_SECTION_SCROLL_MARGIN =
  'scroll-mt-[calc(var(--header-height)+2rem)]';
