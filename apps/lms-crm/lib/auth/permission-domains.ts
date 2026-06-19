/**
 * Domaines permissions pour la matrice IAM (sheets rôles, pilotage).
 * Slugs alignés sur `packages/database/prisma/data/permissions.js`.
 */
export type PermissionDomainRow = {
  slug: string;
  label: string;
};

export type PermissionDomain = {
  id: string;
  label: string;
  permissions: PermissionDomainRow[];
};

export const PERMISSION_DOMAINS: PermissionDomain[] = [
  {
    id: 'crm',
    label: 'CRM backoffice',
    permissions: [
      { slug: 'crm.dashboard.view', label: 'Accueil' },
      { slug: 'crm.ressources.view', label: 'Ressources — lecture' },
      { slug: 'crm.ressources.edit', label: 'Ressources — édition' },
      { slug: 'crm.academique.view', label: 'Académique — lecture' },
      { slug: 'crm.academique.edit', label: 'Académique — édition' },
      { slug: 'crm.finance.view', label: 'Finance — lecture' },
      { slug: 'crm.finance.edit', label: 'Finance — édition' },
      { slug: 'crm.communication.view', label: 'Communication — lecture' },
      { slug: 'crm.communication.edit', label: 'Communication — édition' },
      { slug: 'crm.support.view', label: 'Support — lecture' },
      { slug: 'crm.support.edit', label: 'Support — édition' },
      { slug: 'crm.securite.view', label: 'Sécurité — lecture' },
      { slug: 'crm.securite.edit', label: 'Sécurité — édition' },
      { slug: 'crm.pilotage.view', label: 'Pilotage' },
    ],
  },
  {
    id: 'iam',
    label: 'IAM & accès',
    permissions: [
      { slug: 'iam.users.view', label: 'Comptes — lecture' },
      { slug: 'iam.users.create', label: 'Comptes — création' },
      { slug: 'iam.users.edit', label: 'Comptes — édition' },
      { slug: 'iam.users.delete', label: 'Comptes — suppression' },
      { slug: 'iam.roles.view', label: 'Rôles — lecture' },
      { slug: 'iam.roles.edit', label: 'Rôles — édition' },
      { slug: 'iam.permissions.view', label: 'Permissions — catalogue' },
      { slug: 'iam.logs.view', label: 'Journaux d’accès' },
    ],
  },
  {
    id: 'governance',
    label: 'Gouvernance données',
    permissions: [
      { slug: 'governance.storage.admin', label: 'Coffre documentaire' },
      { slug: 'governance.conformite.view', label: 'Conformité' },
      { slug: 'governance.audit.view', label: 'Audit documentaire' },
    ],
  },
  {
    id: 'lms',
    label: 'E-formation / LMS',
    permissions: [
      { slug: 'lms.course.view', label: 'Suivre un parcours' },
      { slug: 'lms.course.progress', label: 'Progression & quiz' },
      { slug: 'lms.content.draft', label: 'Brouillon contenu' },
      { slug: 'lms.content.submit_review', label: 'Soumettre validation' },
      { slug: 'lms.content.review', label: 'Valider contenu' },
      { slug: 'lms.content.publish', label: 'Publier directement' },
      { slug: 'lms.quiz.author', label: 'Créer quiz' },
      { slug: 'lms.quiz.correct', label: 'Corriger quiz' },
      { slug: 'lms.quiz.validate', label: 'Valider banque quiz' },
      { slug: 'lms.catalog.manage', label: 'Catalogue LMS' },
      { slug: 'lms.analytics.view', label: 'Statistiques LMS' },
    ],
  },
  {
    id: 'chat',
    label: 'Chat',
    permissions: [
      { slug: 'chat.internal.access', label: 'Chat interne staff' },
      { slug: 'chat.session.participate', label: 'Chat session — participation' },
      { slug: 'chat.session.moderate', label: 'Chat session — modération' },
    ],
  },
  {
    id: 'portal',
    label: 'Portail',
    permissions: [
      { slug: 'portal.mobile.access', label: 'Accès portail / mobile' },
      { slug: 'portal.documents.own', label: 'Mes documents' },
      { slug: 'portal.settings.own', label: 'Mes paramètres' },
      { slug: 'in_app_notifications.view', label: 'Notifications in-app' },
    ],
  },
];

export function allDomainPermissionSlugs(): string[] {
  return PERMISSION_DOMAINS.flatMap((d) => d.permissions.map((p) => p.slug));
}

export function domainLabelForPermissionSlug(slug: string): string {
  for (const domain of PERMISSION_DOMAINS) {
    if (domain.permissions.some((p) => p.slug === slug)) {
      return domain.label;
    }
  }
  const prefix = slug.split('.')[0] ?? slug;
  return prefix;
}
