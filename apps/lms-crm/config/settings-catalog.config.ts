/**
 * Catalogue central des réglages configurables — audit plateforme / espaces / modules / pages.
 * Utilisé par la landing Paramètres et la page Paramètres système.
 */

export type SettingsStorageKind =
  | 'SystemSetting'
  | 'ModuleSetting'
  | 'LandingConfig'
  | 'UserNotificationPreference'
  | 'DedicatedPage'
  | 'ExternalModule';

export type SettingsTier = 'platform' | 'user-space' | 'module' | 'page' | 'account';

export type SettingsCatalogEntry = {
  id: string;
  tier: SettingsTier;
  group: string;
  label: string;
  description: string;
  /** Lien direct ou ancre (#settings_*) */
  href: string;
  storage: SettingsStorageKind;
  moduleKey?: string;
  settingKey?: string;
  implemented: boolean;
};

export const SETTINGS_CATALOG_GROUPS = [
  'Établissement & plateforme',
  'Espaces utilisateurs',
  'Modules CRM',
  'Pages & espaces de travail',
  'Comptes utilisateurs',
] as const;

export type SettingsCatalogGroup = (typeof SETTINGS_CATALOG_GROUPS)[number];

const SETTINGS = '/securite-configuration/parametres/settings';

/** Entrées du catalogue — source de vérité pour l’audit Paramètres. */
export const SETTINGS_CATALOG: SettingsCatalogEntry[] = [
  // —— Plateforme (SystemSetting) ——
  {
    id: 'platform-general',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Général',
    description: 'Logo, nom, langue, devise, fuseau, mode maintenance.',
    href: `${SETTINGS}#settings_general`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-etablissement',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Établissement',
    description: 'Identité, adresse, site web, contacts support.',
    href: `${SETTINGS}#settings_etablissement`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-legal',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Identité légale',
    description: 'SIRET, SIREN, CNAPS, TVA, NAF, RCS.',
    href: `${SETTINGS}#settings_legal`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-formation',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Formation & conformité',
    description: 'NDA, Qualiopi, agréments ADEF / SSIAP.',
    href: `${SETTINGS}#settings_formation`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-dirigeant',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Dirigeant',
    description: 'Responsable légal, photo, rôle affiché.',
    href: `${SETTINGS}#settings_dirigeant`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-registre',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Registre INPI',
    description: 'INPI, dates RNE, capital social.',
    href: `${SETTINGS}#settings_registre`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-notifications',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Notifications système',
    description: 'Alertes stock, commandes, paiements, erreurs (rôles cibles).',
    href: `${SETTINGS}#settings_notifications`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-social',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Réseaux sociaux',
    description: 'Facebook, LinkedIn, Instagram, YouTube…',
    href: `${SETTINGS}#settings_social`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-integrations',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Intégrations',
    description: 'Redis, e-mail, Pusher, landing, Sentry.',
    href: `${SETTINGS}#settings_integrations`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'platform-administrative-dossier',
    tier: 'platform',
    group: 'Établissement & plateforme',
    label: 'Dossier administratif (JSON)',
    description: 'Pièces réglementaires et métadonnées dossier école.',
    href: `${SETTINGS}#settings_administrative_dossier`,
    storage: 'SystemSetting',
    implemented: true,
  },

  // —— Espaces utilisateurs (ModuleSetting layout) ——
  {
    id: 'space-crm-dashboard',
    tier: 'user-space',
    group: 'Espaces utilisateurs',
    label: 'Dashboard CRM',
    description: 'KPIs, alertes, bienvenue, raccourcis modules.',
    href: `${SETTINGS}#settings_dashboard`,
    storage: 'ModuleSetting',
    moduleKey: 'crm-dashboard',
    settingKey: 'layout',
    implemented: true,
  },
  {
    id: 'space-formateur-dashboard',
    tier: 'user-space',
    group: 'Espaces utilisateurs',
    label: 'Dashboard formateur',
    description: 'Sessions, stagiaires, tâches pédagogiques.',
    href: `${SETTINGS}#settings_dashboard`,
    storage: 'ModuleSetting',
    moduleKey: 'formateur-dashboard',
    settingKey: 'layout',
    implemented: true,
  },
  {
    id: 'space-stagiaire-dashboard',
    tier: 'user-space',
    group: 'Espaces utilisateurs',
    label: 'Mon dossier stagiaire',
    description: 'Parcours, documents, planning.',
    href: `${SETTINGS}#settings_dashboard`,
    storage: 'ModuleSetting',
    moduleKey: 'stagiaire-dashboard',
    settingKey: 'layout',
    implemented: true,
  },

  // —— Modules CRM (ModuleSetting + pages dédiées) ——
  {
    id: 'module-finance-devis',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Finance — workflow devis',
    description: 'Validité, expiration auto, envoi plaquette, notifications acceptation.',
    href: `${SETTINGS}#settings_modules`,
    storage: 'ModuleSetting',
    moduleKey: 'finance',
    settingKey: 'devis-workflow',
    implemented: true,
  },
  {
    id: 'module-finance-einvoice',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Finance — facturation électronique',
    description: 'Factur-X / PDP — obligation réception 1er sept. 2026.',
    href: `${SETTINGS}#settings_modules`,
    storage: 'ModuleSetting',
    moduleKey: 'finance',
    settingKey: 'einvoice',
    implemented: true,
  },
  {
    id: 'module-support-sla',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Support — SLA tickets',
    description: 'Délais cibles par priorité (heures ouvrées).',
    href: `${SETTINGS}#settings_modules`,
    storage: 'ModuleSetting',
    moduleKey: 'support-qualite',
    settingKey: 'sla',
    implemented: true,
  },
  {
    id: 'module-pilotage',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Pilotage & supervision',
    description: 'Seuils alertes, KPIs affichés — configuration à venir.',
    href: '/pilotage-supervision/pilotage/alertes',
    storage: 'ExternalModule',
    implemented: false,
  },
  {
    id: 'module-vie-scolaire',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Vie scolaire',
    description: 'Parcours candidat, conformité dossier — règles métier par session.',
    href: '/gestion-academique/vie-scolaire/etudiants',
    storage: 'ExternalModule',
    implemented: false,
  },
  {
    id: 'module-rh',
    tier: 'module',
    group: 'Modules CRM',
    label: 'RH & compagnie',
    description: 'Structure, équipes — profil école centralisé dans Paramètres système.',
    href: '/gestion-ressources/compagnie/structure',
    storage: 'DedicatedPage',
    implemented: true,
  },
  {
    id: 'module-equipements',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Équipements & salles',
    description: 'Seuils stock liés aux notifications système.',
    href: `${SETTINGS}#settings_notifications`,
    storage: 'SystemSetting',
    implemented: true,
  },
  {
    id: 'module-acces',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Accès & sécurité',
    description: 'Utilisateurs, rôles, permissions, journaux.',
    href: '/securite-configuration/acces/users',
    storage: 'DedicatedPage',
    implemented: true,
  },
  {
    id: 'module-gouvernance',
    tier: 'module',
    group: 'Modules CRM',
    label: 'Gouvernance données',
    description: 'Storage, corbeille, audit documentaire, demandes pièces.',
    href: '/securite-configuration/gouvernance-donnees/conformite',
    storage: 'DedicatedPage',
    implemented: true,
  },

  // —— Pages & espaces de travail ——
  {
    id: 'page-landing-cms',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'Landing public — sections',
    description: 'Blocs hero, formations, témoignages (LandingConfig).',
    href: '/communication-contenu/cms/pages-landing',
    storage: 'LandingConfig',
    implemented: true,
  },
  {
    id: 'page-landing-catalogue',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'Catalogue vitrine',
    description: 'Fiches formation visibles sur le site public.',
    href: '/communication-contenu/cms/contenus',
    storage: 'DedicatedPage',
    implemented: true,
  },
  {
    id: 'page-seo-meta',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'SEO — meta & indexation',
    description: 'Titres, descriptions, Open Graph organisme.',
    href: '/communication-contenu/seo/meta-indexation',
    storage: 'DedicatedPage',
    implemented: true,
  },
  {
    id: 'page-seo-redirections',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'SEO — redirections',
    description: 'Règles URL et ancres one-page.',
    href: '/communication-contenu/seo/redirections',
    storage: 'DedicatedPage',
    implemented: true,
  },
  {
    id: 'page-marketing-campagnes',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'Campagnes & leads',
    description: 'Sources acquisition, formulaires leads.',
    href: '/communication-contenu/marketing/campagnes',
    storage: 'DedicatedPage',
    implemented: true,
  },
  {
    id: 'page-finance-budget',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'Finance — budget',
    description: 'Pipeline commercial et prévisions.',
    href: '/administration-facturation/finance/budget',
    storage: 'ExternalModule',
    implemented: true,
  },
  {
    id: 'page-finance-devis',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'Finance — devis',
    description: 'Parcours commercial, plaquettes client.',
    href: '/administration-facturation/finance/devis',
    storage: 'ExternalModule',
    implemented: true,
  },
  {
    id: 'page-support-tickets',
    tier: 'page',
    group: 'Pages & espaces de travail',
    label: 'Support — tickets',
    description: 'File support utilisateurs CRM.',
    href: '/support-qualite/support/tickets',
    storage: 'ExternalModule',
    implemented: true,
  },

  // —— Comptes utilisateurs ——
  {
    id: 'account-crm',
    tier: 'account',
    group: 'Comptes utilisateurs',
    label: 'Paramètres compte CRM',
    description: 'Session, présence, notifications personnelles, affichage.',
    href: '/account/parametres',
    storage: 'UserNotificationPreference',
    implemented: true,
  },
  {
    id: 'account-formateur',
    tier: 'account',
    group: 'Comptes utilisateurs',
    label: 'Paramètres formateur',
    description: 'Espace formateur — sécurité et notifications.',
    href: '/formateur/parametres',
    storage: 'UserNotificationPreference',
    implemented: true,
  },
  {
    id: 'account-stagiaire',
    tier: 'account',
    group: 'Comptes utilisateurs',
    label: 'Paramètres stagiaire',
    description: 'Mon dossier — préférences portail.',
    href: '/mon-dossier/parametres',
    storage: 'UserNotificationPreference',
    implemented: true,
  },
];

export function settingsCatalogByGroup(group: SettingsCatalogGroup): SettingsCatalogEntry[] {
  return SETTINGS_CATALOG.filter((e) => e.group === group);
}

export function settingsCatalogAudit() {
  const total = SETTINGS_CATALOG.length;
  const implemented = SETTINGS_CATALOG.filter((e) => e.implemented).length;
  const byTier = (tier: SettingsTier) => ({
    total: SETTINGS_CATALOG.filter((e) => e.tier === tier).length,
    implemented: SETTINGS_CATALOG.filter((e) => e.tier === tier && e.implemented).length,
  });
  return {
    total,
    implemented,
    pending: total - implemented,
    coveragePct: Math.round((implemented / total) * 100),
    byTier: {
      platform: byTier('platform'),
      userSpace: byTier('user-space'),
      module: byTier('module'),
      page: byTier('page'),
      account: byTier('account'),
    },
  };
}
