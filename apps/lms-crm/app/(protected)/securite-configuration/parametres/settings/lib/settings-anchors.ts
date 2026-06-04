export const SETTINGS_BASE_PATH = '/securite-configuration/parametres/settings';

export const SETTINGS_ANCHOR_IDS = {
  general: 'settings_general',
  etablissement: 'settings_etablissement',
  legal: 'settings_legal',
  formation: 'settings_formation',
  dirigeant: 'settings_dirigeant',
  registre: 'settings_registre',
  notifications: 'settings_notifications',
  social: 'settings_social',
  integrations: 'settings_integrations',
} as const;

export type SettingsAnchorId =
  (typeof SETTINGS_ANCHOR_IDS)[keyof typeof SETTINGS_ANCHOR_IDS];

export const SETTINGS_SCROLLSPY_ITEMS = [
  {
    titleKey: 'pages.settings.sidebar.general',
    target: SETTINGS_ANCHOR_IDS.general,
    active: true,
  },
  {
    titleKey: 'pages.settings.sidebar.etablissement',
    target: SETTINGS_ANCHOR_IDS.etablissement,
  },
  {
    titleKey: 'pages.settings.sidebar.legal',
    target: SETTINGS_ANCHOR_IDS.legal,
  },
  {
    titleKey: 'pages.settings.sidebar.formation',
    target: SETTINGS_ANCHOR_IDS.formation,
  },
  {
    titleKey: 'pages.settings.sidebar.dirigeant',
    target: SETTINGS_ANCHOR_IDS.dirigeant,
  },
  {
    titleKey: 'pages.settings.sidebar.registre',
    target: SETTINGS_ANCHOR_IDS.registre,
  },
  {
    titleKey: 'pages.settings.sidebar.notifications',
    target: SETTINGS_ANCHOR_IDS.notifications,
  },
  {
    titleKey: 'pages.settings.sidebar.social',
    target: SETTINGS_ANCHOR_IDS.social,
  },
  {
    titleKey: 'pages.settings.sidebar.integrations',
    target: SETTINGS_ANCHOR_IDS.integrations,
  },
] as const satisfies ReadonlyArray<{
  titleKey: string;
  target: SettingsAnchorId;
  active?: boolean;
}>;

export const SETTINGS_SECTION_SCROLL_MARGIN =
  'scroll-mt-[calc(var(--header-height)+2rem)]';
