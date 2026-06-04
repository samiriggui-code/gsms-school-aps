/**
 * Catalogue aligné sur `apps/lms-landing/components/pricing.tsx` (section Formations).
 * Chaque entrée est classée par parcours pédagogique métier : Initial, MAC, RAN ou Autre.
 */

export type FormationVitrineTrack =
  | 'surete'
  | 'incendie'
  | 'habilitation'
  | 'sst'
  | 'entreprise'
  | 'autres';

/** Initial = première qualification ; MAC = maintien / recyclage ; RAN = remise à niveau ; AUTRE = hors triptyque */
export type FormationParcoursSpecialite = 'INITIAL' | 'MAC' | 'RAN' | 'AUTRE';

/** Correspondance avec les sheets du landing (`pricing.tsx` → « Voir le programme »). */
export type CatalogProgramOpen =
  | { sheet: 'customer' }
  | { sheet: 'mac-aps' }
  | { sheet: 'asra' }
  | { sheet: 'ovt' }
  | { sheet: 'mac-ovt' }
  | { sheet: 'habilitation'; habType: 'H0/B0' | 'BS / BE Manoeuvre' | 'BR' }
  | { sheet: 'ssiap'; level: 1 | 2 | 3; ssiapVariant: 'initial' | 'recyclage' | 'ran' }
  | { sheet: 'sst'; sstType: 'SST Initial' | 'MAC SST' | 'STU' | 'SST Entreprise' }
  | {
      sheet: 'entreprise';
      entrepriseType:
        | 'Guide File / Serre File'
        | 'ARI'
        | 'Manipulation Extincteur'
        | 'ESI'
        | 'SSI'
        | 'CSSI'
        | 'Evacuation Incendie'
        | 'EPI';
    }
  | {
      sheet: 'autres';
      autresType: 'Commission de securite' | 'Formation intra-entreprise securite';
    };

export type FormationVitrineItem = {
  slug: string;
  name: string;
  track: FormationVitrineTrack;
  tag: string;
  duration: string;
  description: string;
  modules: string[];
  outcomes: string[];
  featured: boolean;
  parcoursSpecialite: FormationParcoursSpecialite;
};

export const FORMATION_PARCOURS_LABELS: Record<FormationParcoursSpecialite, string> = {
  INITIAL: 'Initial',
  MAC: 'MAC',
  RAN: 'RAN',
  AUTRE: 'Autre',
};

export const FORMATION_TRACK_LABELS: Record<FormationVitrineTrack, string> = {
  surete: 'Sûreté',
  incendie: 'Incendie',
  habilitation: 'Habilitation électrique',
  sst: 'SST',
  entreprise: 'Entreprise',
  autres: 'Autres',
};

export const FORMATION_VITRINE_CATALOG: FormationVitrineItem[] = [
  {
    slug: 'tfp-aps',
    name: 'TFP APS',
    track: 'surete',
    tag: 'CNAPS',
    duration: '140h a 175h',
    description:
      'Formation initiale Agent de Prevention et de Securite pour debuter dans le metier.',
    modules: [
      'Cadre legal et deontologie',
      'Gestion des conflits et des risques',
      'Rondes, controle d acces et main courante',
      'Mises en situation terrain',
      'Preparation examen',
    ],
    outcomes: ['Agent de prevention', 'Agent de securite mobile', 'Agent de controle'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'mac-aps',
    name: 'MAC APS',
    track: 'surete',
    tag: 'Renouvellement',
    duration: '27h a 34h',
    description: 'Maintien et actualisation des competences pour renouveler la carte professionnelle.',
    modules: [
      'Actualisation juridique et reglementaire',
      'Gestes professionnels et posture',
      'Gestion des situations degradees',
      'Secourisme selon profil',
      'Validation de competences',
    ],
    outcomes: ['Renouvellement carte CNAPS', 'Maintien employabilite', 'Conformite metier'],
    featured: false,
    parcoursSpecialite: 'MAC',
  },
  {
    slug: 'asra-d',
    name: 'ASRA (D)',
    track: 'surete',
    tag: 'Securite renforcee',
    duration: '3 a 4 semaines',
    description:
      'Formation agent de securite renforce arme categorie D selon le cadre reglementaire applicable.',
    modules: [
      'Cadre legal du port et de l usage',
      'Securisation des sites sensibles',
      'Protocoles d intervention',
      'Mises en situation operationnelles',
    ],
    outcomes: ['Agent ASRA D', 'Mission renforcee', 'Employabilite specialisee'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'ovt',
    name: 'OVT',
    track: 'surete',
    tag: 'Titre Pro',
    duration: '283h (40 jours)',
    description:
      'Formation operateur en videoprotection et en telesurveillance pour centres de supervision.',
    modules: [
      'Cadre legal et deontologie',
      'Techniques de telesurveillance',
      'Exploitation de videoprotection',
      'Gestion des alarmes et incidents',
      'Stage pratique en entreprise',
    ],
    outcomes: ['Operateur PC', 'Agent de telesurveillance', 'Operateur videoprotection'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'mac-ovt',
    name: 'MAC OVT',
    track: 'surete',
    tag: 'Recyclage',
    duration: '31h (4 jours)',
    description:
      'Maintien et actualisation des competences pour renouveler la carte professionnelle d operateur vidéoprotection.',
    modules: [
      'Principes de la Republique',
      'Actualisation juridique',
      'Pratiques operationnelles',
      'Maitrise des outils de travail',
      'Prevention risques terroristes',
    ],
    outcomes: ['Renouvellement carte CNAPS', 'Maintien employabilite', 'Mise a jour technique'],
    featured: false,
    parcoursSpecialite: 'MAC',
  },
  {
    slug: 'asc-cynophile',
    name: 'ASC Cynophile',
    track: 'surete',
    tag: 'Titre ASC',
    duration: '315h minimum',
    description:
      'Formation au titre professionnel agent de securite cynophile (maitre-chien), niveau III — binome et missions specialisees.',
    modules: [
      'Legislation et environnement cynophile',
      'Connaissance du chien et binome operateur',
      'Obedience, sociabilite et maniement operationnel',
      'Legitime defense et conduite du mordant',
      'Detection avec chien et preparation au titre',
    ],
    outcomes: ['Agent cynophile qualifie', 'Maitre-chien operationnel', 'Titre ASC niveau III'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'h0-b0',
    name: 'H0/B0',
    track: 'habilitation',
    tag: 'Non-électricien',
    duration: '7h (1 jour)',
    description:
      "Formation pour personnel non-électricien travaillant à proximité d'installations électriques.",
    modules: [
      "Notions élémentaires d'électricité",
      'Sensibilisation aux risques',
      'Prévention et protection',
      'Normes NF C 18-510',
    ],
    outcomes: ['Habilitation H0/B0', 'Sécurité électrique', 'Prévention risques'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'bs-be-manoeuvre',
    name: 'BS / BE Manoeuvre',
    track: 'habilitation',
    tag: 'Manoeuvres',
    duration: '14h (2 jours)',
    description:
      'Habilitation pour réaliser des opérations simples ou des manoeuvres en basse tension.',
    modules: [
      'Analyse des risques',
      'Manoeuvres et interventions',
      'EPI et outillage',
      'Mise en situation pratique',
    ],
    outcomes: ['Habilitation BS/BE', 'Interventions simples', 'Poste technique'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'br',
    name: 'BR',
    track: 'habilitation',
    tag: 'Intervention',
    duration: '21h (3 jours)',
    description:
      "Chargé d'intervention générale en basse tension pour maintenance et dépannage.",
    modules: [
      'Consignation électrique',
      'Dépannage et connexion',
      'Mesures et essais',
      'Sécurisation des travaux',
    ],
    outcomes: ['Habilitation BR', 'Maintenance élec', 'Expertise technique'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'ssiap-1-initial',
    name: 'SSIAP 1 Initial',
    track: 'incendie',
    tag: 'ERP / IGH',
    duration: '67h minimum',
    description:
      'Niveau agent pour prevention incendie, rondes et intervention de premiere urgence.',
    modules: [
      'Prevention incendie et evacuation',
      'Moyens de secours et intervention',
      'Assistance a personnes',
      'Mise en situation pratique',
    ],
    outcomes: ['Agent SSIAP 1', 'Poste ERP/IGH', 'Evolution incendie'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'ssiap-1-recyclage',
    name: 'SSIAP 1 Recyclage',
    track: 'incendie',
    tag: 'MAC',
    duration: '14h (2 jours)',
    description: 'Maintien et actualisation des competences pour les agents SSIAP 1.',
    modules: [
      'Actualisation reglementaire',
      'Moyens de secours',
      'Mises en situation d urgence',
    ],
    outcomes: ['Validite diplome maintenue', 'Maintien employabilite'],
    featured: false,
    parcoursSpecialite: 'MAC',
  },
  {
    slug: 'ssiap-1-ran',
    name: 'SSIAP 1 RAN',
    track: 'incendie',
    tag: 'Remise a Niveau',
    duration: '21h (3 jours)',
    description: 'Remise a niveau pour les agents SSIAP 1 dont le diplome est expire.',
    modules: ['Fondamentaux de la securite', 'Moyens de secours', 'Gestion des alarmes'],
    outcomes: ['Diplome reactive', 'Retour a l emploi'],
    featured: false,
    parcoursSpecialite: 'RAN',
  },
  {
    slug: 'ssiap-2-initial',
    name: 'SSIAP 2 Initial',
    track: 'incendie',
    tag: 'Chef d equipe',
    duration: '70h minimum',
    description:
      'Encadrement d une equipe SSIAP 1 et organisation operationnelle de la securite incendie.',
    modules: [
      'Management equipe SSIAP',
      'Organisation des rondes et consignes',
      'Coordination des interventions',
      'Relation services de secours',
    ],
    outcomes: ['Chef d equipe incendie', 'Encadrement operationnel', 'Pilotage quotidien'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'ssiap-2-recyclage',
    name: 'SSIAP 2 Recyclage',
    track: 'incendie',
    tag: 'MAC',
    duration: '14h (2 jours)',
    description: 'Maintien et actualisation des competences pour les chefs d equipe SSIAP 2.',
    modules: [
      'Actualisation manageriale',
      'Gestion des interventions',
      'Mises en situation de commandement',
    ],
    outcomes: ['Validite diplome maintenue', 'Maintien des competences'],
    featured: false,
    parcoursSpecialite: 'MAC',
  },
  {
    slug: 'ssiap-2-ran',
    name: 'SSIAP 2 RAN',
    track: 'incendie',
    tag: 'Remise a Niveau',
    duration: '21h (3 jours)',
    description: 'Remise a niveau pour les chefs d equipe SSIAP 2 dont le diplome est expire.',
    modules: ['Role du chef d equipe', 'Gestion des alarmes et PC', 'Tactique d intervention'],
    outcomes: ['Diplome reactive', 'Expertise renforcee'],
    featured: false,
    parcoursSpecialite: 'RAN',
  },
  {
    slug: 'ssiap-3-initial',
    name: 'SSIAP 3 Initial',
    track: 'incendie',
    tag: 'Chef de service',
    duration: '216h',
    description: 'Pilotage complet d un service securite incendie en ERP/IGH.',
    modules: [
      'Reglementation avancee ERP/IGH',
      'Gestion des risques et commissions',
      'Management et budget',
      'Organisation globale du service',
    ],
    outcomes: ['Chef de service SSIAP', 'Responsable securite incendie', 'Fonction management'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'ssiap-3-recyclage',
    name: 'SSIAP 3 Recyclage',
    track: 'incendie',
    tag: 'MAC',
    duration: '21h (3 jours)',
    description: 'Maintien et actualisation des competences pour les chefs de service SSIAP 3.',
    modules: ['Evolution reglementaire', 'Gestion des risques majeurs', 'Analyse de sinistres'],
    outcomes: ['Validite diplome maintenue', 'Mise a jour reglementaire'],
    featured: false,
    parcoursSpecialite: 'MAC',
  },
  {
    slug: 'ssiap-3-ran',
    name: 'SSIAP 3 RAN',
    track: 'incendie',
    tag: 'Remise a Niveau',
    duration: '35h (5 jours)',
    description: 'Remise a niveau pour les chefs de service SSIAP 3 dont le diplome est expire.',
    modules: [
      'Accessibilite et commissions',
      'Gestion des contrats de maintenance',
      'Organisation du service',
    ],
    outcomes: ['Diplome reactive', 'Maitrise reglementaire'],
    featured: false,
    parcoursSpecialite: 'RAN',
  },
  {
    slug: 'sst-initial',
    name: 'SST Initial',
    track: 'sst',
    tag: 'INRS',
    duration: '14h',
    description:
      'Formation sauveteur secouriste du travail pour intervenir efficacement en cas d accident.',
    modules: [
      'Proteger, examiner, alerter, secourir',
      'Gestes d urgence et DAE',
      'Prevention des risques professionnels',
      'Mises en situation',
    ],
    outcomes: ['Certificat SST', 'Reflexes secours', 'Culture prevention'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'mac-sst',
    name: 'MAC SST',
    track: 'sst',
    tag: 'Recyclage',
    duration: '7h / 24 mois',
    description:
      'Maintien et actualisation des competences SST pour conserver la validite du certificat.',
    modules: [
      'Actualisation gestes de secours',
      'Scenarios d accident de travail',
      'Rappel prevention et alerte',
      'Evaluation certificative',
    ],
    outcomes: ['Certificat maintenu', 'Competences a jour', 'Conformite entreprise'],
    featured: false,
    parcoursSpecialite: 'MAC',
  },
  {
    slug: 'stu',
    name: 'STU',
    track: 'sst',
    tag: 'Tactique',
    duration: '21h (3 jours)',
    description:
      "Secourisme Tactique d'Urgence pour intervenir en environnement dégradé ou hostile.",
    modules: [
      'Traumatologie balistique',
      'Gestion des hémorragies',
      'Extraction sous stress',
      'Protocoles tactiques (MARCH)',
    ],
    outcomes: ['Certificat STU', 'Expertise tactique', 'Gestion de crise'],
    featured: false,
    parcoursSpecialite: 'INITIAL',
  },
  {
    slug: 'sst-entreprise',
    name: 'SST Entreprise',
    track: 'sst',
    tag: 'Secourisme',
    duration: 'Initial 14h / MAC 7h',
    description:
      'Organisation de sessions SST en intra-entreprise pour former et maintenir les sauveteurs secouristes.',
    modules: [
      'Proteger, examiner, alerter, secourir',
      'Mise en place du dispositif interne',
      'Mises en situation sur risques du site',
      'Evaluation initiale et MAC periodique',
    ],
    outcomes: ['Salaries SST operationnels', 'Conformite secourisme', 'Meilleure reactivite accident'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'guide-file-serre-file',
    name: 'Guide File / Serre File',
    track: 'entreprise',
    tag: 'Evacuation',
    duration: '3h',
    description:
      "Former les salariés désignés à assurer la sécurité lors d'une évacuation d'urgence.",
    modules: [
      "Identifier les signaux d'alarme",
      'Missions du guide et serre-file',
      "Bonnes pratiques d'évacuation",
      'Gestion du point de rassemblement',
    ],
    outcomes: ['Guide-file certifié', 'Serre-file certifié', 'Sécurité évacuation'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'ari',
    name: 'ARI',
    track: 'entreprise',
    tag: 'Protection',
    duration: '7h',
    description:
      "Maîtriser l'utilisation de l'appareil respiratoire isolant en milieu hostile.",
    modules: [
      "Types d'appareils respiratoires",
      'Règles de sécurité et port',
      'Effets des fumées et toxicité',
      'Entretien et vérifications ARI',
    ],
    outcomes: ['Intervenant ARI', 'Sécurité en milieu enfumé', 'Maîtrise technique'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'manipulation-extincteur',
    name: 'Manipulation Extincteur',
    track: 'entreprise',
    tag: 'Incendie',
    duration: '1h30',
    description: 'Apprendre à utiliser efficacement les extincteurs sur un départ de feu.',
    modules: [
      'Classes de feu et agents',
      'Manipulation réelle sur bac à feu',
      'Consignes de sécurité',
      "Procédures d'alerte",
    ],
    outcomes: ['Aptitude extincteurs', 'Réactivité incendie', 'Bons réflexes'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'esi',
    name: 'ESI',
    track: 'entreprise',
    tag: 'Intervention',
    duration: '7h',
    description: 'Équipier de Seconde Intervention pour lutter contre des sinistres complexes.',
    modules: [
      'Reconnaissance en milieu enfumé',
      "Utilisation avancée de l'ARI",
      "Procédures d'alerte et alarme",
      "Coordination d'équipe sauvetage",
    ],
    outcomes: ['Équipier ESI', 'Sauvetage complexe', 'Maîtrise des secours'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'ssi',
    name: 'SSI',
    track: 'entreprise',
    tag: 'Technique',
    duration: '7h',
    description:
      "Compréhension et gestion du Système de Sécurité Incendie de l'établissement.",
    modules: [
      'Catégories de SSI (A à E)',
      'Principes de fonctionnement',
      'Lecture et interprétation SSI',
      "Manipulation en cas d'alarme",
    ],
    outcomes: ['Exploitant SSI', 'Gestion des alarmes', 'Conformité technique'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'cssi',
    name: 'CSSI',
    track: 'entreprise',
    tag: 'Coordination',
    duration: '80h (10j)',
    description:
      'Piloter, contrôler et coordonner la mise en œuvre des systèmes de sécurité incendie.',
    modules: [
      'Analyse des besoins et risques',
      'Conception du zonage sur plan',
      'Cahier des charges fonctionnel',
      'Réception et suivi des travaux',
    ],
    outcomes: ['Coordonnateur SSI', 'Expertise réglementaire', 'Pilotage projet'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'evacuation-incendie',
    name: 'Evacuation Incendie',
    track: 'entreprise',
    tag: 'Sécurité',
    duration: '3h a 7h',
    description: "Acquérir les bons réflexes pour assurer l'évacuation des occupants.",
    modules: [
      'Triangle du feu et propagation',
      'Utilisation extincteurs et RIA',
      'Application consignes évacuation',
      'Exercices pratiques sur site',
    ],
    outcomes: ['Référent évacuation', 'Maîtrise des procédures', 'Sécurité des personnes'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'epi',
    name: 'EPI',
    track: 'entreprise',
    tag: '1ère Intervention',
    duration: '3h a 4h',
    description:
      'Équipier de Première Intervention : intervenir rapidement sur un départ de feu.',
    modules: [
      'Triangle du feu et dangers fumées',
      'Manipulation extincteurs et RIA',
      "Procédures d'alerte interne",
      "Participation à l'évacuation",
    ],
    outcomes: ['Équipier EPI', 'Première intervention', 'Culture sécurité'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'commission-securite',
    name: 'Commission de securite',
    track: 'autres',
    tag: 'Conseil',
    duration: '1 jour',
    description: 'Preparation des etablissements aux commissions de securite et conformite.',
    modules: [
      'Audit pre-visite de conformite',
      'Preparation des registres',
      'Simulation de passage commission',
      'Plan d actions correctives',
    ],
    outcomes: ['Visite preparee', 'Conformite documentaire', 'Expertise conseil'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
  {
    slug: 'intra-entreprise-securite',
    name: 'Formation intra-entreprise securite',
    track: 'autres',
    tag: 'Sur mesure',
    duration: '0.5 a 3 jours',
    description: 'Parcours adaptes au site : accueil securite, evacuation, sensibilisation.',
    modules: [
      'Audit des besoins specifiques',
      'Exercices operationnels equipes',
      'Debriefing et plan d amelioration',
      'Protocoles internes dedies',
    ],
    outcomes: ['Equipes sensibilisees', 'Culture securite', 'Sur mesure'],
    featured: false,
    parcoursSpecialite: 'AUTRE',
  },
];

/**
 * Référentiel CRM (« Ajouter au catalogue », liste, voir / éditer une offre) : même fiche métier que TFP APS
 * (`FormationProgramSheetCustomer`). Pas les sheets vitrine MAC-APS / SSIAP / etc. — ces composants restent sur le landing.
 */
export const FORMATION_CATALOG_PROGRAM_BY_SLUG: Record<string, CatalogProgramOpen> =
  Object.fromEntries(
    FORMATION_VITRINE_CATALOG.map((item) => [item.slug, { sheet: 'customer' } satisfies CatalogProgramOpen]),
  );

export function getFormationCatalogProgram(slug: string): CatalogProgramOpen | undefined {
  return FORMATION_CATALOG_PROGRAM_BY_SLUG[slug];
}
