import {
  Building,
  Euro,
  GraduationCap,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  PackagePlus,
  Shield,
  ShieldCheck,
  Theater,
  TrendingUp,
  Users,
  ClipboardList,
} from 'lucide-react';
import { type MenuConfig } from './types';

/**
 * Hiérarchie CRM (3 niveaux) — alignée sur `.cursor/rules/gestion-ressources-layout.mdc` :
 * Section (landing Accéder) → Module (dashboard) → Feuille.
 * Scaffolds « En construction » autorisés pour figer l’arbre (IA, Financeurs, BPF, Historique).
 */
export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Accueil',
    icon: LayoutGrid,
    path: '/accueil',
  },
  {
    title: 'Pilotage supervision',
    icon: TrendingUp,
    path: '/pilotage-supervision',
    children: [
      {
        title: 'Pilotage',
        path: '/pilotage-supervision/pilotage',
        children: [
          { title: 'Alertes', path: '/pilotage-supervision/pilotage/alertes' },
          { title: 'Indicateurs', path: '/pilotage-supervision/pilotage/indicateurs' },
          { title: 'Rapports', path: '/pilotage-supervision/pilotage/rapports' },
          { title: 'Risques', path: '/pilotage-supervision/pilotage/risques' },
        ],
      },
      {
        title: 'IA',
        path: '/pilotage-supervision/ia',
        children: [
          { title: 'Brouillons à valider', path: '/pilotage-supervision/ia/brouillons' },
          { title: 'Historique', path: '/pilotage-supervision/ia/historique' },
        ],
      },
    ],
  },
  {
    title: 'Gestion ressources',
    icon: Users,
    path: '/gestion-ressources',
    children: [
      {
        title: 'Compagnie',
        path: '/gestion-ressources/compagnie',
        icon: Building,
        children: [
          { title: 'Profil', path: '/gestion-ressources/compagnie/profil' },
          { title: 'Structure', path: '/gestion-ressources/compagnie/structure' },
          { title: 'Documents', path: '/gestion-ressources/compagnie/documents' },
        ],
      },
      {
        title: 'Qualiopi',
        path: '/gestion-ressources/qualiopi',
        icon: ShieldCheck,
        children: [
          { title: 'Passeport session', path: '/gestion-ressources/qualiopi/passeport' },
          { title: 'Classeur', path: '/gestion-ressources/qualiopi/classeur' },
          { title: 'Couverture', path: '/gestion-ressources/qualiopi/couverture' },
          { title: 'Historique', path: '/gestion-ressources/qualiopi/historique' },
          { title: 'Tableau conformité', path: '/gestion-ressources/conformite' },
        ],
      },
      {
        title: 'RH',
        path: '/gestion-ressources/rh',
        children: [
          { title: 'Collaborateurs', path: '/gestion-ressources/rh/collaborateurs' },
          { title: 'Équipes', path: '/gestion-ressources/rh/equipes' },
          { title: 'Formateurs', path: '/gestion-ressources/rh/formateurs' },
          { title: 'Sous-traitants', path: '/gestion-ressources/rh/sous-traitants' },
          { title: 'Référent handicap', path: '/gestion-ressources/rh/referent-handicap' },
          { title: 'Absences', path: '/gestion-ressources/rh/absences' },
        ],
      },
      {
        title: 'Équipements',
        path: '/gestion-ressources/equipements',
        children: [
          {
            title: 'Inventaire',
            path: '/gestion-ressources/equipements/inventaire',
            icon: PackagePlus,
          },
          {
            title: 'Affectations',
            path: '/gestion-ressources/equipements/affectations',
          },
          {
            title: 'Maintenance',
            path: '/gestion-ressources/equipements/maintenance',
          },
          {
            title: 'Salles',
            path: '/gestion-ressources/equipements/salles',
            icon: Theater,
          },
        ],
      },
    ],
  },
  {
    title: 'Gestion académique',
    icon: GraduationCap,
    path: '/gestion-academique',
    children: [
      {
        title: 'Vie scolaire',
        path: '/gestion-academique/vie-scolaire',
        children: [
          {
            title: 'Formations',
            path: '/gestion-academique/vie-scolaire/formations',
          },
          {
            title: 'Cours LMS',
            path: '/gestion-academique/vie-scolaire/cours',
          },
          {
            title: 'Devoirs LMS',
            path: '/gestion-academique/vie-scolaire/devoirs',
          },
          {
            title: 'Discussions LMS',
            path: '/gestion-academique/vie-scolaire/discussions',
          },
          {
            title: 'Inscriptions LMS',
            path: '/gestion-academique/vie-scolaire/inscriptions-lms',
          },
          {
            title: 'Sessions',
            path: '/gestion-academique/vie-scolaire/sessions',
          },
          {
            title: 'Planning',
            path: '/gestion-academique/vie-scolaire/planning',
          },
          {
            title: 'Étudiants',
            path: '/gestion-academique/vie-scolaire/etudiants',
          },
        ],
      },
      {
        title: 'Suivi formations',
        path: '/gestion-academique/suivi-formations',
        icon: ClipboardList,
        children: [
          {
            title: 'Tableau de suivi',
            path: '/gestion-academique/suivi-formations/tableau',
          },
          {
            title: 'Satisfaction',
            path: '/gestion-academique/suivi-formations/satisfaction',
          },
          {
            title: 'Circuits',
            path: '/gestion-academique/suivi-formations/circuits',
          },
        ],
      },
    ],
  },
  {
    title: 'Admin facturation',
    icon: Euro,
    path: '/administration-facturation',
    children: [
      {
        title: 'Finance',
        path: '/administration-facturation/finance',
        children: [
          { title: 'Budget', path: '/administration-facturation/finance/budget' },
          { title: 'Devis', path: '/administration-facturation/finance/devis' },
          { title: 'Factures', path: '/administration-facturation/finance/factures' },
          { title: 'Paiements', path: '/administration-facturation/finance/paiements' },
          { title: 'Financeurs', path: '/administration-facturation/finance/financeurs' },
          { title: 'BPF', path: '/administration-facturation/finance/bpf' },
          { title: 'Export EDOF', path: '/administration-facturation/finance/edof-catalog' },
          { title: 'Rapports', path: '/administration-facturation/finance/rapports' },
        ],
      },
    ],
  },
  {
    title: 'Communication contenu',
    icon: MessageSquare,
    path: '/communication-contenu',
    children: [
      {
        title: 'CMS',
        path: '/communication-contenu/cms',
        children: [
          { title: 'Pages landing', path: '/communication-contenu/cms/pages-landing' },
          { title: 'Équipe landing', path: '/communication-contenu/cms/equipe-landing' },
          { title: 'Catalogue vitrine', path: '/communication-contenu/cms/contenus' },
        ],
      },
      {
        title: 'Marketing',
        path: '/communication-contenu/marketing',
        children: [
          { title: 'Formulaires leads', path: '/communication-contenu/marketing/formulaires-leads' },
          { title: 'Campagnes', path: '/communication-contenu/marketing/campagnes' },
        ],
      },
      {
        title: 'SEO',
        path: '/communication-contenu/seo',
        children: [
          { title: 'Meta indexation', path: '/communication-contenu/seo/meta-indexation' },
          { title: 'Redirections', path: '/communication-contenu/seo/redirections' },
        ],
      },
    ],
  },
  {
    title: 'Support',
    icon: LifeBuoy,
    path: '/support-qualite',
    children: [
      {
        title: 'Support',
        path: '/support-qualite/support',
        children: [
          { title: 'Tickets', path: '/support-qualite/support/tickets' },
          { title: 'Incidents', path: '/support-qualite/support/incidents' },
        ],
      },
    ],
  },
  {
    title: 'Sécurité configuration',
    icon: Shield,
    path: '/securite-configuration',
    children: [
      {
        title: 'Accès',
        path: '/securite-configuration/acces',
        children: [
          { title: 'Utilisateurs', path: '/securite-configuration/acces/users' },
          { title: 'Rôles', path: '/securite-configuration/acces/roles' },
          { title: 'Permissions', path: '/securite-configuration/acces/permissions' },
          { title: 'Logs', path: '/securite-configuration/acces/logs' },
        ],
      },
      {
        title: 'Paramètres',
        path: '/securite-configuration/parametres',
        children: [
          { title: 'Paramètres système', path: '/securite-configuration/parametres/settings' },
          {
            title: 'Layouts & modules',
            path: '/securite-configuration/parametres/settings#settings_dashboard',
          },
          { title: 'Santé système', path: '/securite-configuration/parametres/sante-systeme' },
        ],
      },
      {
        title: 'Gouvernance données',
        path: '/securite-configuration/gouvernance-donnees',
        children: [
          {
            title: 'Conformité',
            path: '/securite-configuration/gouvernance-donnees/conformite',
          },
          {
            title: 'Storage',
            path: '/securite-configuration/gouvernance-donnees/storage',
          },
          {
            title: 'Demandes documents',
            path: '/securite-configuration/gouvernance-donnees/demandes-documents',
          },
          {
            title: 'Corbeille archivage',
            path: '/securite-configuration/gouvernance-donnees/corbeille-archivage',
          },
          {
            title: 'Audit documentaire',
            path: '/securite-configuration/gouvernance-donnees/audit-documentaire',
          },
        ],
      },
    ],
  },
];
