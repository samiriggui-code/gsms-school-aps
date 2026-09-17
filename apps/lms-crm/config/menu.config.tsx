import {
  Building,
  Euro,
  GraduationCap,
  Handshake,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  PackagePlus,
  Shield,
  ShieldCheck,
  Theater,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

/**
 * Hiérarchie CRM (3 niveaux) — Proposition A vague 1+2+3 :
 * Section → Module → Feuille.
 * Qualiopi = section top-level (moteur OF), fusionnée avec l'ancienne
 * section Pilotage supervision (Référentiel / Pilotage / IA = modules).
 */
export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Accueil',
    icon: LayoutGrid,
    path: '/accueil',
  },
  {
    title: 'Qualiopi',
    icon: ShieldCheck,
    path: '/qualiopi',
    children: [
      {
        title: 'Référentiel',
        path: '/qualiopi/referentiel',
        children: [
          { title: 'Passeport session', path: '/qualiopi/referentiel/passeport' },
          { title: 'Classeur', path: '/qualiopi/referentiel/classeur' },
          { title: 'Couverture', path: '/qualiopi/referentiel/couverture' },
          { title: 'Historique', path: '/qualiopi/referentiel/historique' },
          { title: 'Écarts détectés', path: '/qualiopi/referentiel/ecarts' },
        ],
      },
      {
        title: 'Pilotage',
        path: '/qualiopi/pilotage',
        children: [
          { title: 'Alertes & écarts OF', path: '/qualiopi/pilotage/alertes' },
          { title: 'Indicateurs', path: '/qualiopi/pilotage/indicateurs' },
          { title: 'Rapports', path: '/qualiopi/pilotage/rapports' },
        ],
      },
      {
        title: 'IA',
        path: '/qualiopi/ia',
        children: [
          { title: 'Brouillons à valider', path: '/qualiopi/ia/brouillons' },
          { title: 'Historique', path: '/qualiopi/ia/historique' },
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
        title: 'Équipe & habilitations',
        path: '/gestion-ressources/rh',
        children: [
          { title: 'Collaborateurs', path: '/gestion-ressources/rh/collaborateurs' },
          { title: 'Équipes', path: '/gestion-ressources/rh/equipes' },
          { title: 'Formateurs', path: '/gestion-ressources/rh/formateurs' },
          { title: 'Absences', path: '/gestion-ressources/rh/absences' },
        ],
      },
      {
        title: 'Partenaires & accessibilité',
        path: '/gestion-ressources/partenaires',
        icon: Handshake,
        children: [
          { title: 'Sous-traitants', path: '/gestion-ressources/partenaires/sous-traitants' },
          { title: 'Référent handicap', path: '/gestion-ressources/partenaires/referent-handicap' },
        ],
      },
      {
        title: 'Moyens',
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
          { title: 'Formations', path: '/gestion-academique/vie-scolaire/formations' },
          { title: 'Sessions', path: '/gestion-academique/vie-scolaire/sessions' },
          { title: 'Planning', path: '/gestion-academique/vie-scolaire/planning' },
          { title: 'Étudiants', path: '/gestion-academique/vie-scolaire/etudiants' },
        ],
      },
      {
        title: 'LMS',
        path: '/gestion-academique/lms',
        children: [
          { title: 'Cours LMS', path: '/gestion-academique/vie-scolaire/cours' },
          { title: 'Devoirs LMS', path: '/gestion-academique/vie-scolaire/devoirs' },
          { title: 'Discussions LMS', path: '/gestion-academique/vie-scolaire/discussions' },
          { title: 'Inscriptions LMS', path: '/gestion-academique/vie-scolaire/inscriptions-lms' },
        ],
      },
      {
        title: 'Suivi formations',
        path: '/gestion-academique/suivi-formations',
        children: [
          { title: 'Tableau de suivi', path: '/gestion-academique/suivi-formations/tableau' },
          { title: 'Satisfaction', path: '/gestion-academique/suivi-formations/satisfaction' },
          { title: 'Circuits', path: '/gestion-academique/suivi-formations/circuits' },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    icon: Euro,
    path: '/administration-facturation',
    children: [
      {
        title: 'Devis & facturation',
        path: '/administration-facturation/finance',
        children: [
          { title: 'Devis', path: '/administration-facturation/finance/devis' },
          { title: 'Factures', path: '/administration-facturation/finance/factures' },
          { title: 'Paiements', path: '/administration-facturation/finance/paiements' },
        ],
      },
      {
        title: 'Financeurs',
        path: '/administration-facturation/financeurs',
        children: [
          { title: 'Financeurs', path: '/administration-facturation/finance/financeurs' },
          { title: 'Export EDOF', path: '/administration-facturation/finance/edof-catalog' },
        ],
      },
      {
        title: 'Budget & pilotage',
        path: '/administration-facturation/budget',
        children: [
          { title: 'Budget', path: '/administration-facturation/finance/budget' },
          { title: 'BPF', path: '/administration-facturation/finance/bpf' },
          { title: 'Rapports', path: '/administration-facturation/finance/rapports' },
        ],
      },
    ],
  },
  {
    title: 'Vitrine & acquisition',
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
            title: 'Conformité RGPD',
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
