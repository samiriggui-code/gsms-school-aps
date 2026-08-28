/**
 * Référentiel Qualiopi V.9 (8 janvier 2024) — 32 indicateurs.
 * Source d’idées : export audit interne Dolibarr/DigiRisk (feuille de contrôle OK/KO/À réparer/NA).
 * Aucune dépendance runtime — contenu réglementaire reconstruit pour seed GSMS (GSMS-OF-05).
 *
 * Statuts d’audit retenus (conditions.auditStatuses) :
 * OK | KO | TO_FIX | NA
 */

const QUALIOPI_REFERENTIAL_VERSION = 'V9-2024-01-08';

/** @type {Array<{ code: string, criterion: number, indicator: number, label: string, description: string, required?: boolean }>} */
const QUALIOPI_INDICATORS_V9 = [
  {
    code: 'Q-I01',
    criterion: 1,
    indicator: 1,
    label: 'Information publique sur les prestations',
    description:
      'Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, durée, modalités et délais d’accès, tarifs, contacts, méthodes mobilisées et modalités d’évaluation, accessibilité aux personnes handicapées.',
  },
  {
    code: 'Q-I02',
    criterion: 1,
    indicator: 2,
    label: 'Indicateurs de résultats diffusés',
    description:
      'Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et des publics accueillis.',
  },
  {
    code: 'Q-I03',
    criterion: 1,
    indicator: 3,
    label: 'Information certification professionnelle',
    description:
      'Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d’obtention des certifications préparées, les possibilités de valider un/ou des blocs de compétences, ainsi que sur les équivalences, passerelles, suites de parcours et les débouchés.',
  },
  {
    code: 'Q-I04',
    criterion: 2,
    indicator: 4,
    label: 'Analyse du besoin',
    description:
      'Le prestataire analyse le besoin du bénéficiaire en lien avec l’entreprise et/ou le financeur concerné(s).',
  },
  {
    code: 'Q-I05',
    criterion: 2,
    indicator: 5,
    label: 'Objectifs opérationnels et évaluables',
    description: 'Le prestataire définit les objectifs opérationnels et évaluables de la prestation.',
  },
  {
    code: 'Q-I06',
    criterion: 2,
    indicator: 6,
    label: 'Contenus et modalités adaptés',
    description:
      'Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires.',
  },
  {
    code: 'Q-I07',
    criterion: 2,
    indicator: 7,
    label: 'Adéquation contenus / certification',
    description:
      'Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il s’assure de l’adéquation du ou des contenus de la prestation aux exigences de la certification visée.',
  },
  {
    code: 'Q-I08',
    criterion: 2,
    indicator: 8,
    label: 'Positionnement et évaluation des acquis à l’entrée',
    description:
      'Le prestataire détermine les procédures de positionnement et d’évaluation des acquis à l’entrée de la prestation.',
  },
  {
    code: 'Q-I09',
    criterion: 3,
    indicator: 9,
    label: 'Information sur le déroulement',
    description: 'Le prestataire informe les publics bénéficiaires des conditions de déroulement de la prestation.',
  },
  {
    code: 'Q-I10',
    criterion: 3,
    indicator: 10,
    label: 'Adaptation prestation / accompagnement / suivi',
    description:
      'Le prestataire met en œuvre et adapte la prestation, l’accompagnement et le suivi aux publics bénéficiaires.',
  },
  {
    code: 'Q-I11',
    criterion: 3,
    indicator: 11,
    label: 'Évaluation de l’atteinte des objectifs',
    description: 'Le prestataire évalue l’atteinte par les publics bénéficiaires des objectifs de la prestation.',
  },
  {
    code: 'Q-I12',
    criterion: 3,
    indicator: 12,
    label: 'Engagement et prévention des ruptures',
    description:
      'Le prestataire décrit et met en œuvre les mesures pour favoriser l’engagement des bénéficiaires et prévenir les ruptures de parcours.',
  },
  {
    code: 'Q-I13',
    criterion: 3,
    indicator: 13,
    label: 'Alternance — coordination centre / entreprise',
    description:
      'Pour les formations en alternance, le prestataire, en lien avec l’entreprise, anticipe avec l’apprenant les missions confiées, à court, moyen et long terme, et assure la coordination et la progressivité des apprentissages réalisés en centre de formation et en entreprise.',
    required: false,
  },
  {
    code: 'Q-I14',
    criterion: 3,
    indicator: 14,
    label: 'Accompagnement socio-professionnel',
    description:
      'Le prestataire met en œuvre un accompagnement socio-professionnel, éducatif et relatif à l’exercice de la citoyenneté.',
    required: false,
  },
  {
    code: 'Q-I15',
    criterion: 3,
    indicator: 15,
    label: 'Droits et devoirs des apprentis',
    description:
      'Le prestataire informe les apprentis de leurs droits et devoirs en tant qu’apprentis et salariés ainsi que des règles applicables en matière de santé et de sécurité en milieu professionnel.',
    required: false,
  },
  {
    code: 'Q-I16',
    criterion: 3,
    indicator: 16,
    label: 'Conditions de présentation à la certification',
    description:
      'Lorsque le prestataire met en œuvre des formations conduisant à une certification professionnelle, il s’assure que les conditions de présentation des bénéficiaires à la certification respectent les exigences formelles de l’autorité de certification.',
  },
  {
    code: 'Q-I17',
    criterion: 4,
    indicator: 17,
    label: 'Moyens humains, techniques et environnement',
    description:
      'Le prestataire met à disposition ou s’assure de la mise à disposition des moyens humains et techniques adaptés et d’un environnement approprié (conditions, locaux, équipements, plateaux techniques…).',
  },
  {
    code: 'Q-I18',
    criterion: 4,
    indicator: 18,
    label: 'Coordination des intervenants',
    description:
      'Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes (pédagogiques, administratifs, logistiques, commerciaux…).',
  },
  {
    code: 'Q-I19',
    criterion: 4,
    indicator: 19,
    label: 'Ressources pédagogiques',
    description:
      'Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet à celui-ci de se les approprier.',
  },
  {
    code: 'Q-I20',
    criterion: 4,
    indicator: 20,
    label: 'Mobilité, référent handicap, conseil de perfectionnement',
    description:
      'Le prestataire dispose d’un personnel dédié à l’appui à la mobilité nationale et internationale, d’un référent handicap et d’un conseil de perfectionnement.',
    required: false,
  },
  {
    code: 'Q-I21',
    criterion: 5,
    indicator: 21,
    label: 'Compétences des intervenants',
    description:
      'Le prestataire détermine, mobilise et évalue les compétences des différents intervenants internes et/ou externes, adaptées aux prestations.',
  },
  {
    code: 'Q-I22',
    criterion: 5,
    indicator: 22,
    label: 'Développement des compétences du personnel',
    description:
      'Le prestataire entretient et développe les compétences de ses salariés, adaptées aux prestations qu’il délivre.',
  },
  {
    code: 'Q-I23',
    criterion: 6,
    indicator: 23,
    label: 'Veille légale et réglementaire',
    description:
      'Le prestataire réalise une veille légale et réglementaire sur le champ de la formation professionnelle et en exploite les enseignements.',
  },
  {
    code: 'Q-I24',
    criterion: 6,
    indicator: 24,
    label: 'Veille compétences, métiers et emplois',
    description:
      'Le prestataire réalise une veille sur les évolutions des compétences, des métiers et des emplois dans ses secteurs d’intervention et en exploite les enseignements.',
  },
  {
    code: 'Q-I25',
    criterion: 6,
    indicator: 25,
    label: 'Veille innovations pédagogiques et technologiques',
    description:
      'Le prestataire réalise une veille sur les innovations pédagogiques et technologiques permettant une évolution de ses prestations et en exploite les enseignements.',
  },
  {
    code: 'Q-I26',
    criterion: 6,
    indicator: 26,
    label: 'Accueil et orientation des publics en situation de handicap',
    description:
      'Le prestataire mobilise les expertises, outils et réseaux nécessaires pour accueillir, accompagner/former ou orienter les publics en situation de handicap.',
  },
  {
    code: 'Q-I27',
    criterion: 6,
    indicator: 27,
    label: 'Sous-traitance / portage salarial conforme',
    description:
      'Lorsque le prestataire fait appel à la sous-traitance ou au portage salarial, il s’assure du respect de la conformité au présent référentiel.',
  },
  {
    code: 'Q-I28',
    criterion: 6,
    indicator: 28,
    label: 'PFST et partenaires socio-économiques',
    description:
      'Lorsque les prestations dispensées au bénéficiaire comprennent des périodes de formation en situation de travail, le prestataire mobilise son réseau de partenaires socio-économiques pour coconstruire l’ingénierie de formation et favoriser l’accueil en entreprise.',
    required: false,
  },
  {
    code: 'Q-I29',
    criterion: 6,
    indicator: 29,
    label: 'Actions d’insertion ou poursuite d’études',
    description:
      'Le prestataire développe des actions qui concourent à l’insertion professionnelle ou la poursuite d’étude par la voie de l’apprentissage ou par toute autre voie permettant de développer leurs connaissances et leurs compétences.',
    required: false,
  },
  {
    code: 'Q-I30',
    criterion: 7,
    indicator: 30,
    label: 'Recueil des appréciations des parties prenantes',
    description:
      'Le prestataire recueille les appréciations des parties prenantes : bénéficiaires, financeurs, équipes pédagogiques et entreprises concernées.',
  },
  {
    code: 'Q-I31',
    criterion: 7,
    indicator: 31,
    label: 'Traitement des difficultés et réclamations',
    description:
      'Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées par les parties prenantes, des réclamations exprimées par ces dernières, des aléas survenus en cours de prestation.',
  },
  {
    code: 'Q-I32',
    criterion: 7,
    indicator: 32,
    label: 'Mesures d’amélioration continue',
    description:
      'Le prestataire met en œuvre des mesures d’amélioration à partir de l’analyse des appréciations et des réclamations.',
  },
];

module.exports = {
  QUALIOPI_REFERENTIAL_VERSION,
  QUALIOPI_INDICATORS_V9,
};
