import type { ModuleWorkspaceViewKey } from '@repo/api-core';

export type ModuleWorkspacePageMeta = {
  title: string;
  description: string;
};

export const MODULE_WORKSPACE_PAGE_META: Record<ModuleWorkspaceViewKey, ModuleWorkspacePageMeta> = {
  'finance-budget': {
    title: 'Budget',
    description: 'Pipeline commercial, budget validé et prévisions à partir des devis.',
  },
  'finance-paiements': {
    title: 'Paiements',
    description: 'Suivi des encaissements et relances sur devis acceptés ou en attente.',
  },
  'finance-rapports': {
    title: 'Rapports financiers',
    description: 'Consolidation mensuelle devis, leads et chiffre d’affaires accepté.',
  },
  'comm-cms-pages': {
    title: 'Pages landing',
    description: 'Sections et blocs du site public (LandingConfig).',
  },
  'comm-cms-contenus': {
    title: 'Contenus',
    description: 'Catalogue formations et statut de publication landing.',
  },
  'comm-campagnes': {
    title: 'Campagnes',
    description: 'Performance des sources leads (landing, devis, préinscription).',
  },
  'comm-seo-meta': {
    title: 'Meta & indexation',
    description: 'Métadonnées organisme et publication landing.',
  },
  'comm-seo-redirections': {
    title: 'Redirections',
    description: 'Règles de redirection et ancres du site one-page.',
  },
  'support-tickets': {
    title: 'Tickets',
    description: 'File support utilisateurs (tickets CRM).',
  },
  'support-base-aide': {
    title: 'Catalogue formations (aide)',
    description: 'Fiches catalogue actives — documentation complète dans le guide école (/docs).',
  },
  'support-incidents': {
    title: 'Incidents',
    description: 'Matériel hors service et erreurs système à traiter.',
  },
  'gouvernance-storage': {
    title: 'Storage & conformité',
    description: 'Inventaire des fichiers actifs et volume stocké.',
  },
  'gouvernance-demandes': {
    title: 'Demandes de documents',
    description: 'Dossiers candidats en attente de pièces ou validation.',
  },
  'gouvernance-corbeille': {
    title: 'Corbeille & archivage',
    description: 'Fichiers supprimés et comptes en corbeille.',
  },
  'gouvernance-audit': {
    title: 'Audit documentaire',
    description: 'Piste d\'audit conformité et cycle de vie des fichiers GED.',
  },
  'pilotage-alertes': {
    title: 'Alertes',
    description: 'Signaux opérationnels candidatures, finance, équipements et sessions.',
  },
  'pilotage-indicateurs': {
    title: 'Indicateurs',
    description: 'KPI pédagogiques — sessions, examens, participants et parcours terminés.',
  },
  'pilotage-rapports': {
    title: 'Rapports & exports',
    description: 'Synthèse opérationnelle consolidée et extractions CSV.',
  },
  'pilotage-risques': {
    title: 'Risques',
    description: 'Registre des expositions, conformité CNAPS, examens et maintenance.',
  },
};
