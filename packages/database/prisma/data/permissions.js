/**
 * Catalogue permissions école FORM'SSI.
 * Préfixes : crm.* | iam.* | governance.* | lms.* | chat.* | portal.*
 * Les slugs e-commerce (product.*, order.*, …) sont conservés pour compat seed mais dépréciés.
 */
const permissions = [
  // ——— Legacy Metronic (déprécié, non assigné aux rôles métier) ———
  { slug: 'dashboard.view', name: '[Déprécié] View Dashboard', description: 'Legacy Metronic — ne pas utiliser.' },
  { slug: 'user.view', name: '[Déprécié] View Users', description: 'Legacy — utiliser iam.users.view.' },
  { slug: 'user.add', name: '[Déprécié] Add User', description: 'Legacy — utiliser iam.users.create.' },
  { slug: 'user.edit', name: '[Déprécié] Edit User', description: 'Legacy — utiliser iam.users.edit.' },
  { slug: 'user.delete', name: '[Déprécié] Delete User', description: 'Legacy — utiliser iam.users.delete.' },
  { slug: 'role.view', name: '[Déprécié] View Roles', description: 'Legacy — utiliser iam.roles.view.' },
  { slug: 'role.add', name: '[Déprécié] Add Role', description: 'Legacy — utiliser iam.roles.create.' },
  { slug: 'role.edit', name: '[Déprécié] Edit Role', description: 'Legacy — utiliser iam.roles.edit.' },
  { slug: 'role.delete', name: '[Déprécié] Delete Role', description: 'Legacy — utiliser iam.roles.delete.' },
  { slug: 'permission.view', name: '[Déprécié] View Permissions', description: 'Legacy — utiliser iam.permissions.view.' },
  { slug: 'permission.edit', name: '[Déprécié] Edit Permissions', description: 'Legacy — utiliser iam.permissions.edit.' },
  { slug: 'product.view', name: '[Déprécié] View Products', description: 'Legacy e-commerce.' },
  { slug: 'product.add', name: '[Déprécié] Add Product', description: 'Legacy e-commerce.' },
  { slug: 'product.edit', name: '[Déprécié] Edit Product', description: 'Legacy e-commerce.' },
  { slug: 'product.delete', name: '[Déprécié] Delete Product', description: 'Legacy e-commerce.' },
  { slug: 'category.view', name: '[Déprécié] View Categories', description: 'Legacy e-commerce.' },
  { slug: 'category.add', name: '[Déprécié] Add Category', description: 'Legacy e-commerce.' },
  { slug: 'category.edit', name: '[Déprécié] Edit Category', description: 'Legacy e-commerce.' },
  { slug: 'category.delete', name: '[Déprécié] Delete Category', description: 'Legacy e-commerce.' },
  { slug: 'order.view', name: '[Déprécié] View Orders', description: 'Legacy e-commerce.' },
  { slug: 'order.add', name: '[Déprécié] Add Order', description: 'Legacy e-commerce.' },
  { slug: 'order.edit', name: '[Déprécié] Edit Order', description: 'Legacy e-commerce.' },
  { slug: 'order.delete', name: '[Déprécié] Delete Order', description: 'Legacy e-commerce.' },
  { slug: 'order.process', name: '[Déprécié] Process Order', description: 'Legacy e-commerce.' },

  // ——— Transversal ———
  {
    slug: 'report.view',
    name: 'Consulter les rapports',
    description: 'Accès lecture aux rapports et exports analytiques.',
  },
  {
    slug: 'report.export',
    name: 'Exporter les rapports',
    description: 'Télécharger ou exporter les rapports.',
  },
  {
    slug: 'settings.manage',
    name: 'Gérer les paramètres système',
    description: 'Paramètres généraux, intégrations et configuration établissement.',
  },
  {
    slug: 'in_app_notifications.view',
    name: 'Notifications in-app',
    description: 'Accès au centre de notifications et alertes.',
  },

  // ——— CRM modules ———
  { slug: 'crm.dashboard.view', name: 'CRM — Accueil', description: 'Tableau de bord CRM.' },
  {
    slug: 'crm.ressources.view',
    name: 'CRM — Ressources (lecture)',
    description: 'Compagnie, RH, équipements.',
  },
  {
    slug: 'crm.ressources.edit',
    name: 'CRM — Ressources (édition)',
    description: 'Créer et modifier RH, compagnie, équipements.',
  },
  {
    slug: 'crm.academique.view',
    name: 'CRM — Académique (lecture)',
    description: 'Formations, sessions, étudiants, vie scolaire.',
  },
  {
    slug: 'crm.academique.edit',
    name: 'CRM — Académique (édition)',
    description: 'Gérer formations, sessions et workflows académiques.',
  },
  {
    slug: 'crm.finance.view',
    name: 'CRM — Finance (lecture)',
    description: 'Devis, factures, paiements.',
  },
  {
    slug: 'crm.finance.edit',
    name: 'CRM — Finance (édition)',
    description: 'Créer et modifier les documents financiers.',
  },
  {
    slug: 'crm.communication.view',
    name: 'CRM — Communication (lecture)',
    description: 'CMS, marketing, SEO.',
  },
  {
    slug: 'crm.communication.edit',
    name: 'CRM — Communication (édition)',
    description: 'Éditer landing, campagnes et SEO.',
  },
  {
    slug: 'crm.support.view',
    name: 'CRM — Support (lecture)',
    description: 'Tickets et base d’aide.',
  },
  {
    slug: 'crm.support.edit',
    name: 'CRM — Support (édition)',
    description: 'Traiter les tickets support.',
  },
  {
    slug: 'crm.securite.view',
    name: 'CRM — Sécurité (lecture)',
    description: 'Utilisateurs, rôles, journaux d’accès.',
  },
  {
    slug: 'crm.securite.edit',
    name: 'CRM — Sécurité (édition)',
    description: 'IAM, paramètres sensibles, gouvernance.',
  },
  {
    slug: 'crm.pilotage.view',
    name: 'CRM — Pilotage',
    description: 'Pilotage, qualité, rapports avancés.',
  },

  // ——— IAM ———
  { slug: 'iam.users.view', name: 'IAM — Voir les comptes', description: 'Liste et fiches utilisateurs.' },
  { slug: 'iam.users.create', name: 'IAM — Créer un compte', description: 'Inviter ou créer un utilisateur.' },
  { slug: 'iam.users.edit', name: 'IAM — Modifier un compte', description: 'Éditer profil, rôle, statut.' },
  { slug: 'iam.users.delete', name: 'IAM — Supprimer un compte', description: 'Désactiver ou supprimer un compte.' },
  { slug: 'iam.roles.view', name: 'IAM — Voir les rôles', description: 'Catalogue des rôles métier.' },
  { slug: 'iam.roles.edit', name: 'IAM — Modifier les rôles', description: 'Matrice permissions par rôle.' },
  { slug: 'iam.permissions.view', name: 'IAM — Voir les permissions', description: 'Catalogue des permissions.' },
  { slug: 'iam.logs.view', name: 'IAM — Journaux d’accès', description: 'Audit connexions et actions IAM.' },

  // ——— Gouvernance données ———
  {
    slug: 'governance.storage.admin',
    name: 'Gouvernance — Coffre documentaire',
    description: 'Administration du stockage et arborescence socle.',
  },
  {
    slug: 'governance.conformite.view',
    name: 'Gouvernance — Conformité (lecture)',
    description: 'Dossiers conformité et CNAPS.',
  },
  {
    slug: 'governance.audit.view',
    name: 'Gouvernance — Audit documentaire',
    description: 'Piste d’audit documentaire.',
  },

  // ——— LMS / e-formation ———
  {
    slug: 'lms.course.view',
    name: 'LMS — Suivre un parcours',
    description: 'Consulter leçons et progression (apprenant / formateur).',
  },
  {
    slug: 'lms.course.progress',
    name: 'LMS — Progression & quiz',
    description: 'Marquer la progression et passer les quiz.',
  },
  {
    slug: 'lms.content.draft',
    name: 'LMS — Brouillon contenu',
    description: 'Créer et modifier chapitres, activités, quiz en brouillon.',
  },
  {
    slug: 'lms.content.submit_review',
    name: 'LMS — Soumettre à validation',
    description: 'Envoyer le contenu à la validation pédagogique / RH.',
  },
  {
    slug: 'lms.content.review',
    name: 'LMS — Valider le contenu',
    description: 'Approuver ou refuser le contenu en attente.',
  },
  {
    slug: 'lms.content.publish',
    name: 'LMS — Publier directement',
    description: 'Publication sans file de validation.',
  },
  {
    slug: 'lms.quiz.author',
    name: 'LMS — Créer des quiz',
    description: 'Banques de questions et activités quiz.',
  },
  {
    slug: 'lms.quiz.correct',
    name: 'LMS — Corriger les quiz',
    description: 'Voir tentatives et corriger les réponses.',
  },
  {
    slug: 'lms.quiz.validate',
    name: 'LMS — Valider les quiz',
    description: 'Valider une banque quiz avant mise en ligne.',
  },
  {
    slug: 'lms.catalog.manage',
    name: 'LMS — Catalogue',
    description: 'Lier parcours LMS au catalogue formations.',
  },
  {
    slug: 'lms.analytics.view',
    name: 'LMS — Statistiques',
    description: 'Taux de réussite, progression globale.',
  },

  // ——— Chat ———
  {
    slug: 'chat.internal.access',
    name: 'Chat — Accès interne',
    description: 'Conversations directes et groupes staff / formateur.',
  },
  {
    slug: 'chat.session.participate',
    name: 'Chat — Session (participation)',
    description: 'Participer au chat de sa session de formation.',
  },
  {
    slug: 'chat.session.moderate',
    name: 'Chat — Session (modération)',
    description: 'Modérer le chat d’une session (équipe pédagogique).',
  },

  // ——— Portail ———
  {
    slug: 'portal.mobile.access',
    name: 'Portail — Accès mobile',
    description: 'Connexion espace formateur, apprenant ou collaborateur mobile.',
  },
  {
    slug: 'portal.documents.own',
    name: 'Portail — Mes documents',
    description: 'Consulter ses propres pièces et dossier.',
  },
  {
    slug: 'portal.settings.own',
    name: 'Portail — Mes paramètres',
    description: 'Préférences compte et notifications personnelles.',
  },
];

module.exports = permissions;
