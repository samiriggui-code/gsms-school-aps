/**
 * Référentiel Qualiopi V.9 (8 janvier 2024) — 32 indicateurs.
 * Source d’idées : export audit interne Dolibarr/DigiRisk (feuille de contrôle OK/KO/À réparer/NA).
 * Métadonnées YAML alignées sur qualiopi-rag/data/qualiopi-markdown-v9/indicateurs/*.md
 * Aucune dépendance runtime — contenu réglementaire reconstruit pour seed GSMS (GSMS-OF-05).
 *
 * Statuts d’audit retenus (conditions.auditStatuses) :
 * OK | KO | TO_FIX | NA
 */

const QUALIOPI_REFERENTIAL_VERSION = 'V9-2024-01-08';

/**
 * @typedef {'mineure_ou_majeure' | 'majeure_uniquement'} QualiopiPonderation
 * @typedef {'applicable' | 'non_concerne'} QualiopiSousTraitance
 * @typedef {{
 *   code: string,
 *   criterion: number,
 *   indicator: number,
 *   label: string,
 *   description: string,
 *   ponderation: QualiopiPonderation,
 *   nouveauxEntrants: boolean,
 *   sousTraitance: QualiopiSousTraitance,
 *   required?: boolean,
 *   prismaHints?: string[],
 * }} QualiopiIndicatorV9
 */

/** @type {QualiopiIndicatorV9[]} */
const QUALIOPI_INDICATORS_V9 = [
  {
    code: 'Q-I01',
    criterion: 1,
    indicator: 1,
    label: 'Information publique sur les prestations',
    description:
      'Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, durée, modalités et délais d’accès, tarifs, contacts, méthodes mobilisées et modalités d’évaluation, accessibilité aux personnes handicapées.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'applicable',
    prismaHints: ['Formation.publicAccess*', 'Formation.prerequisitesTable', 'SystemSetting'],
  },
  {
    code: 'Q-I02',
    criterion: 1,
    indicator: 2,
    label: 'Indicateurs de résultats diffusés',
    description:
      'Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et des publics accueillis.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: true,
    sousTraitance: 'applicable',
    prismaHints: ['CertificationOutcomeStat', 'Formation.successRate'],
  },
  {
    code: 'Q-I03',
    criterion: 1,
    indicator: 3,
    label: 'Information certification professionnelle',
    description:
      'Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d’obtention des certifications préparées, les possibilités de valider un/ou des blocs de compétences, ainsi que sur les équivalences, passerelles, suites de parcours et les débouchés.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: true,
    sousTraitance: 'applicable',
    prismaHints: ['CertificationOutcomeStat', 'Formation.rncp*', 'Formation.certificationSteps'],
  },
  {
    code: 'Q-I04',
    criterion: 2,
    indicator: 4,
    label: 'Analyse du besoin',
    description:
      'Le prestataire analyse le besoin du bénéficiaire en lien avec l’entreprise et/ou le financeur concerné(s).',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['CandidatureAssessment.NEEDS_ANALYSIS', 'TrainingRequest', 'FundingCase'],
  },
  {
    code: 'Q-I05',
    criterion: 2,
    indicator: 5,
    label: 'Objectifs opérationnels et évaluables',
    description: 'Le prestataire définit les objectifs opérationnels et évaluables de la prestation.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'applicable',
    prismaHints: ['Formation.operationalObjectivesSummary', 'Formation.outcomes'],
  },
  {
    code: 'Q-I06',
    criterion: 2,
    indicator: 6,
    label: 'Contenus et modalités adaptés',
    description:
      'Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['Formation.contentModalitiesSummary', 'Formation.modules', 'FormationSession.pedagogicalOutline'],
  },
  {
    code: 'Q-I07',
    criterion: 2,
    indicator: 7,
    label: 'Adéquation contenus / certification',
    description:
      'Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il s’assure de l’adéquation du ou des contenus de la prestation aux exigences de la certification visée.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'applicable',
    prismaHints: ['Formation.certificationAdequacyNotes', 'Formation.rncp*'],
  },
  {
    code: 'Q-I08',
    criterion: 2,
    indicator: 8,
    label: 'Positionnement et évaluation des acquis à l’entrée',
    description:
      'Le prestataire détermine les procédures de positionnement et d’évaluation des acquis à l’entrée de la prestation.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['CandidatureAssessment.POSITIONING'],
  },
  {
    code: 'Q-I09',
    criterion: 3,
    indicator: 9,
    label: 'Information sur les conditions de déroulement',
    description:
      'Le prestataire informe les publics bénéficiaires des conditions de déroulement de la prestation.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'applicable',
    prismaHints: ['FormationSessionConvention', 'PortalSessionAnnouncement'],
  },
  {
    code: 'Q-I10',
    criterion: 3,
    indicator: 10,
    label: 'Adaptation de la prestation aux publics',
    description:
      'Le prestataire met en œuvre et adapte la prestation, l’accompagnement et le suivi aux publics bénéficiaires.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['CandidatureAssessment.adaptation*', 'FormationSessionEmargement'],
  },
  {
    code: 'Q-I11',
    criterion: 3,
    indicator: 11,
    label: 'Évaluation de l’atteinte des objectifs',
    description:
      'Le prestataire évalue l’atteinte par les publics bénéficiaires des objectifs de la prestation.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: true,
    sousTraitance: 'non_concerne',
    prismaHints: ['FormativeAssessment', 'FormationExam'],
  },
  {
    code: 'Q-I12',
    criterion: 3,
    indicator: 12,
    label: 'Engagement et prévention des ruptures',
    description:
      'Le prestataire décrit et met en œuvre les mesures pour favoriser l’engagement des bénéficiaires et prévenir les ruptures de parcours.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['EngagementMeasure', 'FormationSessionParticipant.dropoutRisk*'],
  },
  {
    code: 'Q-I13',
    criterion: 3,
    indicator: 13,
    label: 'Coordination alternance / entreprise',
    description:
      'Pour les formations en alternance, le prestataire, en lien avec l’entreprise, anticipe avec l’apprenant les missions confiées, à court, moyen et long terme, et assure la coordination entre le formateur, le tuteur et l’apprenant.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: true,
    sousTraitance: 'applicable',
    required: false,
    prismaHints: ['CompanyTutorLink', 'ApprenticeshipMission'],
  },
  {
    code: 'Q-I14',
    criterion: 3,
    indicator: 14,
    label: 'Accompagnement socio-professionnel',
    description:
      'Le prestataire met en œuvre un accompagnement socio-professionnel, éducatif et relatif à l’exercice de la citoyenneté.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: true,
    sousTraitance: 'non_concerne',
    required: false,
    prismaHints: ['SocioProfessionalSupportAction'],
  },
  {
    code: 'Q-I15',
    criterion: 3,
    indicator: 15,
    label: 'Droits et devoirs des apprentis',
    description:
      'Le prestataire informe les apprentis de leurs droits et devoirs en tant qu’apprentis et salariés ainsi que des règles applicables en matière de santé et de sécurité au travail.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    required: false,
    prismaHints: ['ApprenticeRightsAck'],
  },
  {
    code: 'Q-I16',
    criterion: 3,
    indicator: 16,
    label: 'Conditions de présentation à la certification',
    description:
      'Lorsque le prestataire met en œuvre des formations conduisant à une certification professionnelle, il s’assure que les conditions de présentation aux épreuves de certification respectent les exigences du certificateur.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'applicable',
    prismaHints: ['SessionCertificationPresentation', 'FormationExam'],
  },
  {
    code: 'Q-I17',
    criterion: 4,
    indicator: 17,
    label: 'Moyens humains, techniques et environnement',
    description:
      'Le prestataire met à disposition ou s’assure de la mise à disposition des moyens humains et techniques adaptés et d’un environnement approprié.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['FormationVenueRoom', 'Equipment', 'FormationSession.trainerUserId'],
  },
  {
    code: 'Q-I18',
    criterion: 4,
    indicator: 18,
    label: 'Coordination des intervenants',
    description:
      'Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes (pédagogiques, administratifs, logistiques, commerciaux) qui interviennent dans la mise en œuvre des prestations.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['SessionIntervenantAssignment', 'RhTeam'],
  },
  {
    code: 'Q-I19',
    criterion: 4,
    indicator: 19,
    label: 'Ressources pédagogiques',
    description:
      'Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet à celui-ci de se les approprier.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: true,
    sousTraitance: 'non_concerne',
    prismaHints: ['PedagogicalResourceDelivery', 'Course', 'Attachment'],
  },
  {
    code: 'Q-I20',
    criterion: 4,
    indicator: 20,
    label: 'Référent handicap et mobilité',
    description:
      'Le prestataire dispose d’un personnel dédié à l’appui à la mobilité nationale et internationale, d’un référent handicap et d’un conseil de perfectionnement.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    required: false,
    prismaHints: [
      'SystemSetting.disabilityReferent*',
      'SystemSetting.mobilityReferent*',
      'PerfectionnementCouncilMeeting',
    ],
  },
  {
    code: 'Q-I21',
    criterion: 5,
    indicator: 21,
    label: 'Compétences des intervenants',
    description:
      'Le prestataire détermine, mobilise et évalue les compétences des différents intervenants internes et/ou externes, adaptées aux prestations.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['TrainerCompetencyReview', 'FormateurProfile'],
  },
  {
    code: 'Q-I22',
    criterion: 5,
    indicator: 22,
    label: 'Développement des compétences du personnel',
    description:
      'Le prestataire entretient et développe les compétences de ses salariés, adaptées aux prestations qu’il délivre.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: true,
    sousTraitance: 'non_concerne',
    prismaHints: ['StaffDevelopmentAction', 'CollaborateurProfile'],
  },
  {
    code: 'Q-I23',
    criterion: 6,
    indicator: 23,
    label: 'Veille légale et réglementaire',
    description:
      'Le prestataire réalise une veille légale et réglementaire sur le champ de la formation professionnelle et en exploite les enseignements.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['WatchItem.LEGAL_REGULATORY', 'WatchExploitation'],
  },
  {
    code: 'Q-I24',
    criterion: 6,
    indicator: 24,
    label: 'Veille compétences, métiers et emplois',
    description:
      'Le prestataire réalise une veille sur les évolutions des compétences, des métiers et des emplois dans ses secteurs d’intervention et en exploite les enseignements.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: true,
    sousTraitance: 'non_concerne',
    prismaHints: ['WatchItem.SKILLS_JOBS_EMPLOYMENT', 'WatchExploitation'],
  },
  {
    code: 'Q-I25',
    criterion: 6,
    indicator: 25,
    label: 'Veille innovations pédagogiques et technologiques',
    description:
      'Le prestataire réalise une veille sur les innovations pédagogiques et technologiques permettant une évolution de ses prestations et en exploite les enseignements.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: true,
    sousTraitance: 'non_concerne',
    prismaHints: ['WatchItem.PEDAGOGICAL_TECHNOLOGICAL', 'WatchExploitation'],
  },
  {
    code: 'Q-I26',
    criterion: 6,
    indicator: 26,
    label: 'Accueil et orientation des publics en situation de handicap',
    description:
      'Le prestataire mobilise les expertises, outils et réseaux nécessaires pour accueillir, accompagner/former ou orienter les publics en situation de handicap.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: true,
    sousTraitance: 'applicable',
    prismaHints: ['SystemSetting.disabilityReferent*', 'HandicapNetworkPartner', 'AdaptationStatus'],
  },
  {
    code: 'Q-I27',
    criterion: 6,
    indicator: 27,
    label: 'Sous-traitance / portage salarial conforme',
    description:
      'Lorsque le prestataire fait appel à la sous-traitance ou au portage salarial, il s’assure du respect de la conformité au présent référentiel.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['SubcontractorRecord', 'ComplianceDossier SUBCONTRACTOR'],
  },
  {
    code: 'Q-I28',
    criterion: 6,
    indicator: 28,
    label: 'PFST et partenaires socio-économiques',
    description:
      'Lorsque les prestations dispensées au bénéficiaire comprennent des périodes de formation en situation de travail, le prestataire mobilise son réseau de partenaires socio-économiques pour coconstruire l’ingénierie de formation et favoriser l’accueil en entreprise.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'applicable',
    required: false,
    prismaHints: ['SocioEconomicPartnership'],
  },
  {
    code: 'Q-I29',
    criterion: 6,
    indicator: 29,
    label: 'Actions d’insertion ou poursuite d’études',
    description:
      'Le prestataire développe des actions qui concourent à l’insertion professionnelle ou la poursuite d’étude par la voie de l’apprentissage ou par toute autre voie permettant de développer leurs connaissances et leurs compétences.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    required: false,
    prismaHints: ['InsertionFollowUp'],
  },
  {
    code: 'Q-I30',
    criterion: 7,
    indicator: 30,
    label: 'Recueil des appréciations des parties prenantes',
    description:
      'Le prestataire recueille les appréciations des parties prenantes : bénéficiaires, financeurs, équipes pédagogiques et entreprises concernées.',
    ponderation: 'mineure_ou_majeure',
    nouveauxEntrants: false,
    sousTraitance: 'applicable',
    prismaHints: ['SatisfactionSurvey'],
  },
  {
    code: 'Q-I31',
    criterion: 7,
    indicator: 31,
    label: 'Traitement des difficultés et réclamations',
    description:
      'Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées par les parties prenantes, des réclamations exprimées par ces dernières, des aléas survenus en cours de prestation.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: false,
    sousTraitance: 'non_concerne',
    prismaHints: ['SupportTicket.isComplaint', 'QualityIncident.isComplaint'],
  },
  {
    code: 'Q-I32',
    criterion: 7,
    indicator: 32,
    label: 'Mesures d’amélioration continue',
    description:
      'Le prestataire met en œuvre des mesures d’amélioration à partir de l’analyse des appréciations et des réclamations.',
    ponderation: 'majeure_uniquement',
    nouveauxEntrants: true,
    sousTraitance: 'non_concerne',
    prismaHints: ['ContinuousImprovementAction'],
  },
];

module.exports = {
  QUALIOPI_REFERENTIAL_VERSION,
  QUALIOPI_INDICATORS_V9,
};
