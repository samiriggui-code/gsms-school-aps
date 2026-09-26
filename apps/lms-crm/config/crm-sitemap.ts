import {
  Euro,
  GraduationCap,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  Shield,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** Feuille CRM — écran de travail (liste / formulaire). */
export type CrmLeaf = {
  title: string;
  path: string;
  description: string;
};

/** Module CRM — landing dashboard entre section et feuilles. */
export type CrmModule = {
  title: string;
  path: string;
  description: string;
  leaves: CrmLeaf[];
};

/** Section CRM — landing racine + modules. */
export type CrmSection = {
  title: string;
  path: string;
  description: string;
  icon: LucideIcon;
  modules: CrmModule[];
};

/**
 * Source de vérité CRM — Proposition A vague 1+2+3 :
 * Section → Module → Feuille. Qualiopi = section top-level, fusionnée avec
 * l'ancienne section Pilotage supervision (Référentiel / Pilotage / IA = modules).
 */
export const CRM_SECTIONS: CrmSection[] = [
  {
    title: 'Qualiopi',
    path: '/qualiopi',
    description: 'Moteur conformité, pilotage et IA de l’organisme.',
    icon: ShieldCheck,
    modules: [
      {
        title: 'Référentiel',
        path: '/qualiopi/referentiel',
        description: 'Classeur, couverture Evidence, passeport session.',
        leaves: [
          { title: 'Passeport session', path: '/qualiopi/referentiel/passeport', description: 'Stress test session (règles Q1).' },
          { title: 'Classeur', path: '/qualiopi/referentiel/classeur', description: 'Jugement OK/KO des 32 indicateurs.' },
          { title: 'Couverture', path: '/qualiopi/referentiel/couverture', description: 'Preuves Evidence liées.' },
          { title: 'Historique', path: '/qualiopi/referentiel/historique', description: 'Timeline des événements d’audit.' },
          { title: 'Écarts détectés', path: '/qualiopi/referentiel/ecarts', description: 'Synthèse des non-conformités Qualiopi.' },
          {
            title: 'Cartographie front',
            path: '/qualiopi/referentiel/cartographie-front',
            description: 'Page → indicateurs Qualiopi (référentiel dev).',
          },
        ],
      },
      {
        title: 'Pilotage',
        path: '/qualiopi/pilotage',
        description: 'Signaux, KPI et risques.',
        leaves: [
          {
            title: 'Alertes & écarts OF',
            path: '/qualiopi/pilotage/alertes',
            description: 'File unique : écarts Qualiopi et signaux ops.',
          },
          { title: 'Indicateurs', path: '/qualiopi/pilotage/indicateurs', description: 'KPI de l’organisme.' },
          { title: 'Rapports', path: '/qualiopi/pilotage/rapports', description: 'Exports et synthèses.' },
          { title: 'Veille', path: '/qualiopi/pilotage/veille', description: 'Veille légale / métiers / pédagogique (I23–25).' },
          {
            title: 'Amélioration continue',
            path: '/qualiopi/pilotage/amelioration',
            description: 'Plans d’action I32.',
          },
        ],
      },
      {
        title: 'IA',
        path: '/qualiopi/ia',
        description: 'Assistants et validations IA.',
        leaves: [
          { title: 'Brouillons à valider', path: '/qualiopi/ia/brouillons', description: 'Propositions IA à valider.' },
          { title: 'Historique', path: '/qualiopi/ia/historique', description: 'Runs et artefacts passés.' },
        ],
      },
    ],
  },
  {
    title: 'Gestion ressources',
    path: '/gestion-ressources',
    description: 'Compagnie, équipe, partenaires et moyens.',
    icon: Users,
    modules: [
      {
        title: 'Compagnie',
        path: '/gestion-ressources/compagnie',
        description: 'Identité et structure de l’organisme.',
        leaves: [
          { title: 'Profil', path: '/gestion-ressources/compagnie/profil', description: 'Identité de l’organisme.' },
          { title: 'Structure', path: '/gestion-ressources/compagnie/structure', description: 'Organigramme et sites.' },
          { title: 'Documents', path: '/gestion-ressources/compagnie/documents', description: 'Pièces administratives.' },
          {
            title: 'Conseil de perfectionnement',
            path: '/gestion-ressources/compagnie/conseil-perfectionnement',
            description: 'PV et décisions (I20).',
          },
        ],
      },
      {
        title: 'Équipe & habilitations',
        path: '/gestion-ressources/rh',
        description: 'Collaborateurs, formateurs et absences.',
        leaves: [
          { title: 'Collaborateurs', path: '/gestion-ressources/rh/collaborateurs', description: 'Personnel interne.' },
          { title: 'Équipes', path: '/gestion-ressources/rh/equipes', description: 'Composition des équipes.' },
          { title: 'Formateurs', path: '/gestion-ressources/rh/formateurs', description: 'Intervenants pédagogiques.' },
          { title: 'Absences', path: '/gestion-ressources/rh/absences', description: 'Congés et absences.' },
          {
            title: 'Compétences intervenants',
            path: '/gestion-ressources/rh/competences',
            description: 'Évaluation compétences (I21).',
          },
          {
            title: 'Développement salariés',
            path: '/gestion-ressources/rh/developpement',
            description: 'Plans formation interne (I22).',
          },
        ],
      },
      {
        title: 'Partenaires & accessibilité',
        path: '/gestion-ressources/partenaires',
        description: 'Sous-traitants (I27) et référent handicap (I20/I26).',
        leaves: [
          {
            title: 'Sous-traitants',
            path: '/gestion-ressources/partenaires/sous-traitants',
            description: 'Prestataires externes.',
          },
          {
            title: 'Référent handicap',
            path: '/gestion-ressources/partenaires/referent-handicap',
            description: 'Référent et suivi.',
          },
          {
            title: 'Réseau handicap',
            path: '/gestion-ressources/partenaires/reseau-handicap',
            description: 'Expertises / réseaux (I26).',
          },
          {
            title: 'Partenaires PFST',
            path: '/gestion-ressources/partenaires/pfst',
            description: 'Partenaires socio-éco (I28).',
          },
        ],
      },
      {
        title: 'Moyens',
        path: '/gestion-ressources/equipements',
        description: 'Parc matériel et salles.',
        leaves: [
          { title: 'Inventaire', path: '/gestion-ressources/equipements/inventaire', description: 'Parc matériel.' },
          { title: 'Affectations', path: '/gestion-ressources/equipements/affectations', description: 'Qui a quoi.' },
          { title: 'Maintenance', path: '/gestion-ressources/equipements/maintenance', description: 'Entretien du parc.' },
          { title: 'Salles', path: '/gestion-ressources/equipements/salles', description: 'Locaux de formation.' },
        ],
      },
    ],
  },
  {
    title: 'Gestion académique',
    path: '/gestion-academique',
    description: 'Parcours, sessions, stagiaires et suivi.',
    icon: GraduationCap,
    modules: [
      {
        title: 'Vie scolaire',
        path: '/gestion-academique/vie-scolaire',
        description: 'Catalogue, sessions, planning et étudiants (présentiel).',
        leaves: [
          { title: 'Formations', path: '/gestion-academique/vie-scolaire/formations', description: 'Catalogue pédagogique.' },
          { title: 'Sessions', path: '/gestion-academique/vie-scolaire/sessions', description: 'Sessions de formation.' },
          { title: 'Planning', path: '/gestion-academique/vie-scolaire/planning', description: 'Calendrier pédagogique.' },
          { title: 'Étudiants', path: '/gestion-academique/vie-scolaire/etudiants', description: 'Apprenants.' },
          {
            title: 'Alternance',
            path: '/gestion-academique/vie-scolaire/alternance',
            description: 'Tuteurs / missions / droits apprentis (I13–15).',
          },
          {
            title: 'Insertion',
            path: '/gestion-academique/vie-scolaire/insertion',
            description: 'Suivi insertion / poursuite d’études (I29).',
          },
        ],
      },
      {
        title: 'LMS',
        path: '/gestion-academique/lms',
        description: 'Cours, devoirs, discussions et inscriptions en ligne.',
        leaves: [
          { title: 'Cours LMS', path: '/gestion-academique/lms/cours', description: 'Contenus LMS.' },
          { title: 'Devoirs LMS', path: '/gestion-academique/lms/devoirs', description: 'Travaux à rendre.' },
          { title: 'Discussions LMS', path: '/gestion-academique/lms/discussions', description: 'Forums de cours.' },
          { title: 'Inscriptions LMS', path: '/gestion-academique/lms/inscriptions', description: 'Inscriptions aux parcours.' },
        ],
      },
      {
        title: 'Suivi formations',
        path: '/gestion-academique/suivi-formations',
        description: 'Avancement, satisfaction et circuits de suivi.',
        leaves: [
          { title: 'Tableau de suivi', path: '/gestion-academique/suivi-formations/tableau', description: 'Avancement des parcours.' },
          { title: 'Satisfaction', path: '/gestion-academique/suivi-formations/satisfaction', description: 'Enquêtes et scores.' },
          { title: 'Circuits', path: '/gestion-academique/suivi-formations/circuits', description: 'Workflows de suivi.' },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    path: '/administration-facturation',
    description: 'Budget, devis, factures et financeurs.',
    icon: Euro,
    modules: [
      {
        title: 'Devis & facturation',
        path: '/administration-facturation/finance',
        description: 'Cycle commercial : devis, factures, paiements.',
        leaves: [
          { title: 'Devis', path: '/administration-facturation/finance/devis', description: 'Devis commerciaux.' },
          { title: 'Factures', path: '/administration-facturation/finance/factures', description: 'Facturation.' },
          { title: 'Paiements', path: '/administration-facturation/finance/paiements', description: 'Encaissements.' },
        ],
      },
      {
        title: 'Financeurs',
        path: '/administration-facturation/financeurs',
        description: 'Dispositifs de financement et export EDOF.',
        leaves: [
          { title: 'Financeurs', path: '/administration-facturation/financeurs/dossiers', description: 'OPCO, CPF, entreprises.' },
          { title: 'Export EDOF', path: '/administration-facturation/financeurs/edof-catalog', description: 'Catalogue EDOF.' },
        ],
      },
      {
        title: 'Budget & pilotage',
        path: '/administration-facturation/budget',
        description: 'Budgets, bilan pédagogique et reporting.',
        leaves: [
          { title: 'Budget', path: '/administration-facturation/budget/lignes', description: 'Budgets et enveloppes.' },
          { title: 'BPF', path: '/administration-facturation/budget/bpf', description: 'Bilan pédagogique et financier.' },
          { title: 'Rapports', path: '/administration-facturation/budget/rapports', description: 'Reporting financier.' },
        ],
      },
    ],
  },
  {
    title: 'Vitrine & acquisition',
    path: '/communication-contenu',
    description: 'Site, leads, campagnes et SEO.',
    icon: MessageSquare,
    modules: [
      {
        title: 'CMS',
        path: '/communication-contenu/cms',
        description: 'Pages et catalogue vitrine.',
        leaves: [
          { title: 'Pages landing', path: '/communication-contenu/cms/pages-landing', description: 'Pages du site public.' },
          { title: 'Équipe landing', path: '/communication-contenu/cms/equipe-landing', description: 'Membres affichés sur le site.' },
          { title: 'Catalogue vitrine', path: '/communication-contenu/cms/contenus', description: 'Offres visibles en ligne.' },
        ],
      },
      {
        title: 'Marketing',
        path: '/communication-contenu/marketing',
        description: 'Leads et campagnes.',
        leaves: [
          { title: 'Formulaires leads', path: '/communication-contenu/marketing/formulaires-leads', description: 'Captures de leads.' },
          { title: 'Campagnes', path: '/communication-contenu/marketing/campagnes', description: 'Campagnes marketing.' },
        ],
      },
      {
        title: 'SEO',
        path: '/communication-contenu/seo',
        description: 'Indexation et redirects.',
        leaves: [
          { title: 'Meta indexation', path: '/communication-contenu/seo/meta-indexation', description: 'Balises et indexation.' },
          { title: 'Redirections', path: '/communication-contenu/seo/redirections', description: 'Redirects HTTP.' },
        ],
      },
    ],
  },
  {
    title: 'Support',
    path: '/support-qualite',
    description: 'Tickets et incidents.',
    icon: LifeBuoy,
    modules: [
      {
        title: 'Support',
        path: '/support-qualite/support',
        description: 'Demandes et incidents.',
        leaves: [
          { title: 'Tickets', path: '/support-qualite/support/tickets', description: 'Demandes support.' },
          { title: 'Incidents', path: '/support-qualite/support/incidents', description: 'Incidents qualité / SI.' },
        ],
      },
    ],
  },
  {
    title: 'Sécurité configuration',
    path: '/securite-configuration',
    description: 'Accès, paramètres et données.',
    icon: Shield,
    modules: [
      {
        title: 'Accès',
        path: '/securite-configuration/acces',
        description: 'Comptes, rôles et logs.',
        leaves: [
          { title: 'Utilisateurs', path: '/securite-configuration/acces/users', description: 'Comptes CRM.' },
          { title: 'Rôles', path: '/securite-configuration/acces/roles', description: 'Rôles applicatifs.' },
          { title: 'Permissions', path: '/securite-configuration/acces/permissions', description: 'Droits fins.' },
          { title: 'Logs', path: '/securite-configuration/acces/logs', description: 'Journal d’accès.' },
        ],
      },
      {
        title: 'Paramètres',
        path: '/securite-configuration/parametres',
        description: 'Configuration et santé.',
        leaves: [
          { title: 'Paramètres système', path: '/securite-configuration/parametres/settings', description: 'Configuration système.' },
          { title: 'Santé système', path: '/securite-configuration/parametres/sante-systeme', description: 'État des services.' },
        ],
      },
      {
        title: 'Gouvernance données',
        path: '/securite-configuration/gouvernance-donnees',
        description: 'RGPD, stockage et archivage.',
        leaves: [
          { title: 'Conformité RGPD', path: '/securite-configuration/gouvernance-donnees/conformite', description: 'RGPD / conformité données.' },
          { title: 'Storage', path: '/securite-configuration/gouvernance-donnees/storage', description: 'Fichiers et rétention.' },
          { title: 'Demandes documents', path: '/securite-configuration/gouvernance-donnees/demandes-documents', description: 'Demandes d’accès.' },
          { title: 'Corbeille archivage', path: '/securite-configuration/gouvernance-donnees/corbeille-archivage', description: 'Archivage et suppression.' },
          { title: 'Audit documentaire', path: '/securite-configuration/gouvernance-donnees/audit-documentaire', description: 'Traçabilité documents.' },
        ],
      },
    ],
  },
];

export const CRM_ACCUEIL = {
  title: 'Accueil',
  path: '/accueil',
  icon: LayoutGrid,
  description: 'Tableau de bord CRM.',
} as const;

export function findCrmSection(path: string): CrmSection | undefined {
  const clean = path.split('#')[0] ?? path;
  // Match section la plus spécifique (ex. /qualiopi avant un éventuel préfixe plus court)
  const matches = CRM_SECTIONS.filter(
    (s) => clean === s.path || clean.startsWith(`${s.path}/`),
  );
  return matches.sort((a, b) => b.path.length - a.path.length)[0];
}

export function findCrmModule(path: string): CrmModule | undefined {
  const clean = path.split('#')[0] ?? path;
  // 1) Feuille explicitement rattachée (ex. sous-traitants → Partenaires, pas RH)
  for (const section of CRM_SECTIONS) {
    for (const mod of section.modules) {
      if (mod.leaves.some((l) => l.path === clean)) return mod;
    }
  }
  // 2) Préfixe module (landing + sous-chemins)
  for (const section of CRM_SECTIONS) {
    for (const mod of section.modules) {
      if (clean === mod.path || clean.startsWith(`${mod.path}/`)) return mod;
    }
  }
  return undefined;
}

export function findCrmLeaf(path: string): CrmLeaf | undefined {
  const clean = path.split('#')[0] ?? path;
  for (const section of CRM_SECTIONS) {
    for (const mod of section.modules) {
      const leaf = mod.leaves.find((l) => l.path === clean);
      if (leaf) return leaf;
    }
  }
  return undefined;
}

export function allCrmLeafPaths(): string[] {
  return CRM_SECTIONS.flatMap((s) => s.modules.flatMap((m) => m.leaves.map((l) => l.path)));
}

export function allCrmModulePaths(): string[] {
  return CRM_SECTIONS.flatMap((s) => s.modules.map((m) => m.path));
}

export function allCrmSectionPaths(): string[] {
  return CRM_SECTIONS.map((s) => s.path);
}
