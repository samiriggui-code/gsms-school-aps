const sstModulesFr = [
  {
    id: 'MOD1',
    title: 'Le rôle du SST',
    details: ["Cadre juridique de l'intervention.", "Rôle dans l'organisation de la prévention."],
  },
  {
    id: 'MOD2',
    title: 'Protéger, Examiner, Alerter',
    details: [
      'Reconnaître les dangers persistants.',
      'Identifier les signes vitaux.',
      "Transmettre un message d'alerte efficace.",
    ],
  },
  {
    id: 'MOD3',
    title: 'Secourir',
    details: [
      'La victime saigne abondamment.',
      "La victime s'étouffe.",
      'La victime se plaint de sensations pénibles.',
      'La victime est inconsciente et respire (PLS).',
      'La victime ne respire plus (RCP + DAE).',
    ],
  },
  {
    id: 'MOD4',
    title: 'Prévention des risques',
    details: [
      'Repérer les dangers dans une situation de travail.',
      'Proposer des actions de prévention.',
    ],
  },
];

const sstModulesEn = [
  {
    id: 'MOD1',
    title: 'SST role and responsibilities',
    details: ['Legal framework of intervention.', 'Role in prevention organization.'],
  },
  {
    id: 'MOD2',
    title: 'Protect, Assess, Alert',
    details: [
      'Identify ongoing hazards.',
      'Identify key vital signs.',
      'Deliver an effective alert message.',
    ],
  },
  {
    id: 'MOD3',
    title: 'Provide first aid',
    details: [
      'Severe bleeding response.',
      'Choking response.',
      'Response to acute discomfort symptoms.',
      'Unconscious casualty with breathing (recovery position).',
      'No breathing (CPR + AED).',
    ],
  },
  {
    id: 'MOD4',
    title: 'Risk prevention',
    details: ['Identify workplace hazards.', 'Propose prevention actions.'],
  },
];

const stuModulesFr = [
  {
    id: 'MOD1',
    title: 'Introduction et Fondamentaux',
    details: [
      'Cadre du secourisme tactique.',
      'Protection balistique et explosive.',
      'Traumatologie balistique.',
    ],
  },
  {
    id: 'MOD2',
    title: 'Gestes de Secours Tactiques',
    details: [
      'Utilisation du tourniquet (garrot).',
      'Pansement israélien.',
      'Contrôle des hémorragies massives.',
    ],
  },
  {
    id: 'MOD3',
    title: "Phases d'Intervention",
    details: [
      'Protocoles SAFE / MARCH.',
      'Sauvetage sous menace (Care Under Fire).',
      'Secours en zone sécurisée.',
    ],
  },
  {
    id: 'MOD4',
    title: 'Simulations Intensives',
    details: [
      'Exercices sous stress.',
      "Coordination avec les forces de l'ordre.",
      'Extraction de victimes.',
    ],
  },
];

const stuModulesEn = [
  {
    id: 'MOD1',
    title: 'Introduction and Fundamentals',
    details: ['Tactical first-aid framework.', 'Ballistic and blast protection.', 'Ballistic trauma basics.'],
  },
  {
    id: 'MOD2',
    title: 'Tactical lifesaving actions',
    details: ['Tourniquet application.', 'Israeli bandage use.', 'Massive hemorrhage control.'],
  },
  {
    id: 'MOD3',
    title: 'Intervention phases',
    details: [
      'SAFE / MARCH protocols.',
      'Care Under Fire procedures.',
      'Care in secure zones.',
    ],
  },
  {
    id: 'MOD4',
    title: 'Intensive simulations',
    details: [
      'High-stress exercises.',
      'Coordination with law enforcement.',
      'Casualty extraction.',
    ],
  },
];

export const sheetContentSstMessages = {
  fr: {
    landing: {
      sheetContent: {
        sst: {
          initial: {
            stats1: {
              durationTotal: '14h',
              durationBadge: '2j',
              durationText: 'formation complète',
              traineesTotal: '4-10',
              priceTotal: '180',
              priceBadge: 'EUR',
              priceText: 'à partir de',
              priceSuffix: '€',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '2j', total: '14h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'OUI',
              funding: '100%',
              recycle: '24 mois',
              validity: '2 ans',
              recycleLabel: 'Recyclage',
              validityLabel: 'Validité Titre',
            },
            modules: sstModulesFr,
            prerequisites: {
              rows: [
                { item: 'Certification', detail: 'Aucun diplôme requis', importance: 'Indispensable' },
                { item: 'Français', detail: "Savoir s'exprimer en français", importance: 'Requis' },
                { item: 'Santé', detail: 'Aptitude physique aux gestes de secours', importance: 'Obligatoire' },
              ],
            },
            presentation: {
              title: 'SST Initial',
              intro:
                'Formation pour devenir Sauveteur Secouriste du Travail, premier maillon de la chaîne de secours en entreprise.',
              suffix: "Conforme aux documents cadres de l'INRS.",
              bullets: [
                'Protéger, Examiner, Alerter',
                'Secourir la victime',
                'Prévention des risques pros',
                'Utilisation du DAE',
              ],
              badge: 'Certifié Qualiopi',
            },
            loyalty: {
              title: 'SST',
              subtitle: 'Secourisme',
              description: 'La référence INRS pour le secourisme en milieu professionnel.',
              audience: {
                title: 'Public concerné',
                subtitle: 'Bénéficiaires',
                value: 'Tout salarié',
              },
              prerequisites: {
                title: 'Prérequis',
                subtitle: "Conditions d'accès",
                value: 'Aucun',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Organisme / Norme',
                badge: 'INRS',
                value: 'SST',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Évaluation Continue',
                  description:
                    'Validation des gestes techniques tout au long de la formation par des cas concrets.',
                  badge: 'Suivi',
                },
                {
                  title: 'Épreuve Certificative',
                  description:
                    "Mise en situation d'accident du travail simulé selon les critères INRS.",
                  badge: 'Examen',
                },
                {
                  title: 'Certificat Officiel',
                  description:
                    "Délivrance du certificat SST (équivalence PSC1) reconnu par l'Assurance Maladie.",
                  badge: 'Diplôme',
                },
              ],
            },
            sessions: {
              subtitle: 'SST Initial',
            },
          },
          mac: {
            stats1: {
              durationTotal: '7h',
              durationBadge: '1j',
              durationText: 'maintien des acquis',
              traineesTotal: '4-10',
              priceTotal: '90',
              priceBadge: 'EUR',
              priceText: 'à partir de',
              priceSuffix: '€',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '1j', total: '7h', theory: '30%', practice: '70%' },
            prerequisiteStats: {
              cpf: 'OUI',
              funding: '100%',
              recycle: '24 mois',
              validity: '2 ans',
              recycleLabel: 'Recyclage',
              validityLabel: 'Validité Titre',
            },
            modules: sstModulesFr,
            prerequisites: {
              rows: [
                {
                  item: 'Certification',
                  detail: 'Être titulaire du certificat SST',
                  importance: 'Indispensable',
                },
                { item: 'Français', detail: "Savoir s'exprimer en français", importance: 'Requis' },
                { item: 'Santé', detail: 'Aptitude physique aux gestes de secours', importance: 'Obligatoire' },
              ],
            },
            presentation: {
              title: 'MAC SST',
              intro:
                'Maintien et Actualisation des Compétences obligatoire tous les 24 mois pour conserver la validité du certificat.',
              suffix: "Conforme aux documents cadres de l'INRS.",
              bullets: [
                'Protéger, Examiner, Alerter',
                'Secourir la victime',
                'Prévention des risques pros',
                'Utilisation du DAE',
              ],
              badge: 'Certifié Qualiopi',
            },
            loyalty: {
              title: 'MAC',
              subtitle: 'Secourisme',
              description: 'La référence INRS pour le secourisme en milieu professionnel.',
              audience: {
                title: 'Public concerné',
                subtitle: 'Bénéficiaires',
                value: 'Tout salarié',
              },
              prerequisites: {
                title: 'Prérequis',
                subtitle: "Conditions d'accès",
                value: 'Certificat SST',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Organisme / Norme',
                badge: 'INRS',
                value: 'SST',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Évaluation Continue',
                  description:
                    'Validation des gestes techniques tout au long de la formation par des cas concrets.',
                  badge: 'Suivi',
                },
                {
                  title: 'Épreuve Certificative',
                  description:
                    "Mise en situation d'accident du travail simulé selon les critères INRS.",
                  badge: 'Examen',
                },
                {
                  title: 'Certificat Officiel',
                  description:
                    "Délivrance du certificat SST (équivalence PSC1) reconnu par l'Assurance Maladie.",
                  badge: 'Diplôme',
                },
              ],
            },
            sessions: {
              subtitle: 'MAC SST',
            },
          },
          stu: {
            stats1: {
              durationTotal: '21h',
              durationBadge: '3j',
              durationText: 'formation complète',
              traineesTotal: '1-12',
              priceTotal: '350',
              priceBadge: 'EUR',
              priceText: 'à partir de',
              priceSuffix: '€',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '3j', total: '21h', theory: '30%', practice: '70%' },
            prerequisiteStats: {
              cpf: 'NON',
              funding: '100%',
              recycle: '24 mois',
              validity: '2 ans',
              recycleLabel: 'Recyclage',
              validityLabel: 'Validité Titre',
            },
            modules: stuModulesFr,
            prerequisites: {
              rows: [
                {
                  item: 'Certification',
                  detail: 'SST ou PSC1 en cours de validité',
                  importance: 'Indispensable',
                },
                { item: 'Français', detail: "Savoir s'exprimer en français", importance: 'Requis' },
                { item: 'Santé', detail: 'Aptitude physique aux gestes de secours', importance: 'Obligatoire' },
              ],
            },
            presentation: {
              title: 'STU',
              intro:
                "Secourisme Tactique d'Urgence pour intervenir en environnement hostile, dégradé ou lors de situations de crise.",
              suffix: "Préparation aux situations d'exception.",
              bullets: [
                'Traumatologie balistique',
                'Gestion des hémorragies',
                'Extraction sous stress',
                'Protocoles SAFE / MARCH',
              ],
              badge: 'Certifié Qualiopi',
            },
            loyalty: {
              title: 'STU',
              subtitle: 'Secourisme',
              description: "Formation d'excellence pour le sauvetage sous stress et menace.",
              audience: {
                title: 'Public concerné',
                subtitle: 'Bénéficiaires',
                value: "Agents Sûreté / Forces l'ordre",
              },
              prerequisites: {
                title: 'Prérequis',
                subtitle: "Conditions d'accès",
                value: 'SST / PSC1 valide',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Organisme / Norme',
                badge: 'SI.Groupe',
                value: 'STU',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Évaluation Continue',
                  description:
                    'Validation des gestes techniques tout au long de la formation par des cas concrets.',
                  badge: 'Suivi',
                },
                {
                  title: 'Épreuve Certificative',
                  description: "Mise en situation d'exception devant jury.",
                  badge: 'Examen',
                },
                {
                  title: 'Certificat Officiel',
                  description: 'Délivrance du certificat STU SI.Groupe.',
                  badge: 'Diplôme',
                },
              ],
            },
            sessions: {
              subtitle: 'STU',
            },
          },
          entreprise: {
            stats1: {
              durationTotal: '14h',
              durationBadge: '2j',
              durationText: 'formation complète',
              traineesTotal: '4-10',
              priceTotal: 'Sur devis',
              priceBadge: 'DEVIS',
              priceText: 'nous contacter',
              priceSuffix: '',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '2j', total: '14h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'OUI',
              funding: '100%',
              recycle: '24 mois',
              validity: '2 ans',
              recycleLabel: 'Recyclage',
              validityLabel: 'Validité Titre',
            },
            modules: sstModulesFr,
            prerequisites: {
              rows: [
                { item: 'Certification', detail: 'Aucun diplôme requis', importance: 'Indispensable' },
                { item: 'Français', detail: "Savoir s'exprimer en français", importance: 'Requis' },
                { item: 'Santé', detail: 'Aptitude physique aux gestes de secours', importance: 'Obligatoire' },
              ],
            },
            presentation: {
              title: 'SST Entreprise',
              intro:
                'Session organisée directement dans vos locaux, adaptée aux risques spécifiques de votre activité.',
              suffix: "Conforme aux documents cadres de l'INRS.",
              bullets: [
                'Protéger, Examiner, Alerter',
                'Secourir la victime',
                'Prévention des risques pros',
                'Utilisation du DAE',
              ],
              badge: 'Certifié Qualiopi',
            },
            loyalty: {
              title: 'SST',
              subtitle: 'Secourisme',
              description: 'La référence INRS pour le secourisme en milieu professionnel.',
              audience: {
                title: 'Public concerné',
                subtitle: 'Bénéficiaires',
                value: 'Salariés (Intra)',
              },
              prerequisites: {
                title: 'Prérequis',
                subtitle: "Conditions d'accès",
                value: 'Aucun',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Organisme / Norme',
                badge: 'INRS',
                value: 'SST',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Évaluation Continue',
                  description:
                    'Validation des gestes techniques tout au long de la formation par des cas concrets.',
                  badge: 'Suivi',
                },
                {
                  title: 'Épreuve Certificative',
                  description:
                    "Mise en situation d'accident du travail simulé selon les critères INRS.",
                  badge: 'Examen',
                },
                {
                  title: 'Certificat Officiel',
                  description:
                    "Délivrance du certificat SST (équivalence PSC1) reconnu par l'Assurance Maladie.",
                  badge: 'Diplôme',
                },
              ],
            },
            sessions: {
              subtitle: 'SST Entreprise',
            },
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        sst: {
          initial: {
            stats1: {
              durationTotal: '14h',
              durationBadge: '2d',
              durationText: 'full course',
              traineesTotal: '4-10',
              priceTotal: '180',
              priceBadge: 'EUR',
              priceText: 'from',
              priceSuffix: '€',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '2d', total: '14h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'YES',
              funding: '100%',
              recycle: '24 months',
              validity: '2 years',
              recycleLabel: 'Refresher',
              validityLabel: 'Certificate validity',
            },
            modules: sstModulesEn,
            prerequisites: {
              rows: [
                { item: 'Certification', detail: 'No prior diploma required', importance: 'Essential' },
                { item: 'French', detail: 'Ability to communicate in French', importance: 'Required' },
                { item: 'Health', detail: 'Physical ability to perform first-aid actions', importance: 'Mandatory' },
              ],
            },
            presentation: {
              title: 'Initial SST',
              intro:
                'Training to become a workplace first aider, the first link in the company emergency chain.',
              suffix: 'Compliant with INRS reference documents.',
              bullets: [
                'Protect, Assess, Alert',
                'Assist the casualty',
                'Occupational risk prevention',
                'AED use',
              ],
              badge: 'Qualiopi certified',
            },
            loyalty: {
              title: 'SST',
              subtitle: 'First aid',
              description: 'The INRS benchmark for workplace first aid.',
              audience: {
                title: 'Target audience',
                subtitle: 'Learners',
                value: 'Any employee',
              },
              prerequisites: {
                title: 'Prerequisites',
                subtitle: 'Entry requirements',
                value: 'None',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Body / Standard',
                badge: 'INRS',
                value: 'SST',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Continuous assessment',
                  description:
                    'Validation of practical actions throughout the training with real-life scenarios.',
                  badge: 'Tracking',
                },
                {
                  title: 'Certification assessment',
                  description: 'Simulated workplace accident scenario based on INRS standards.',
                  badge: 'Exam',
                },
                {
                  title: 'Official certificate',
                  description:
                    'Issuance of the SST certificate (PSC1 equivalence) recognized by French Health Insurance.',
                  badge: 'Diploma',
                },
              ],
            },
            sessions: {
              subtitle: 'Initial SST',
            },
          },
          mac: {
            stats1: {
              durationTotal: '7h',
              durationBadge: '1d',
              durationText: 'skills maintenance',
              traineesTotal: '4-10',
              priceTotal: '90',
              priceBadge: 'EUR',
              priceText: 'from',
              priceSuffix: '€',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '1d', total: '7h', theory: '30%', practice: '70%' },
            prerequisiteStats: {
              cpf: 'YES',
              funding: '100%',
              recycle: '24 months',
              validity: '2 years',
              recycleLabel: 'Refresher',
              validityLabel: 'Certificate validity',
            },
            modules: sstModulesEn,
            prerequisites: {
              rows: [
                {
                  item: 'Certification',
                  detail: 'Must hold a valid SST certificate',
                  importance: 'Essential',
                },
                { item: 'French', detail: 'Ability to communicate in French', importance: 'Required' },
                { item: 'Health', detail: 'Physical ability to perform first-aid actions', importance: 'Mandatory' },
              ],
            },
            presentation: {
              title: 'SST Refresher',
              intro:
                'Mandatory skills refresh every 24 months to keep the certificate valid.',
              suffix: 'Compliant with INRS reference documents.',
              bullets: [
                'Protect, Assess, Alert',
                'Assist the casualty',
                'Occupational risk prevention',
                'AED use',
              ],
              badge: 'Qualiopi certified',
            },
            loyalty: {
              title: 'MAC',
              subtitle: 'First aid',
              description: 'The INRS benchmark for workplace first aid.',
              audience: {
                title: 'Target audience',
                subtitle: 'Learners',
                value: 'Any employee',
              },
              prerequisites: {
                title: 'Prerequisites',
                subtitle: 'Entry requirements',
                value: 'SST certificate',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Body / Standard',
                badge: 'INRS',
                value: 'SST',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Continuous assessment',
                  description:
                    'Validation of practical actions throughout the training with real-life scenarios.',
                  badge: 'Tracking',
                },
                {
                  title: 'Certification assessment',
                  description: 'Simulated workplace accident scenario based on INRS standards.',
                  badge: 'Exam',
                },
                {
                  title: 'Official certificate',
                  description:
                    'Issuance of the SST certificate (PSC1 equivalence) recognized by French Health Insurance.',
                  badge: 'Diploma',
                },
              ],
            },
            sessions: {
              subtitle: 'SST Refresher',
            },
          },
          stu: {
            stats1: {
              durationTotal: '21h',
              durationBadge: '3d',
              durationText: 'full course',
              traineesTotal: '1-12',
              priceTotal: '350',
              priceBadge: 'EUR',
              priceText: 'from',
              priceSuffix: '€',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '3d', total: '21h', theory: '30%', practice: '70%' },
            prerequisiteStats: {
              cpf: 'NO',
              funding: '100%',
              recycle: '24 months',
              validity: '2 years',
              recycleLabel: 'Refresher',
              validityLabel: 'Certificate validity',
            },
            modules: stuModulesEn,
            prerequisites: {
              rows: [
                {
                  item: 'Certification',
                  detail: 'Valid SST or PSC1 required',
                  importance: 'Essential',
                },
                { item: 'French', detail: 'Ability to communicate in French', importance: 'Required' },
                { item: 'Health', detail: 'Physical ability to perform first-aid actions', importance: 'Mandatory' },
              ],
            },
            presentation: {
              title: 'STU',
              intro:
                'Tactical emergency first aid designed for hostile or degraded environments and crisis situations.',
              suffix: 'Preparation for exceptional scenarios.',
              bullets: [
                'Ballistic trauma',
                'Hemorrhage management',
                'Extraction under stress',
                'SAFE / MARCH protocols',
              ],
              badge: 'Qualiopi certified',
            },
            loyalty: {
              title: 'STU',
              subtitle: 'First aid',
              description: 'High-end course for rescue operations under stress and threat.',
              audience: {
                title: 'Target audience',
                subtitle: 'Learners',
                value: 'Security agents / law enforcement',
              },
              prerequisites: {
                title: 'Prerequisites',
                subtitle: 'Entry requirements',
                value: 'Valid SST / PSC1',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Body / Standard',
                badge: 'SI.Groupe',
                value: 'STU',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Continuous assessment',
                  description:
                    'Validation of practical actions throughout the training with real-life scenarios.',
                  badge: 'Tracking',
                },
                {
                  title: 'Certification assessment',
                  description: 'Exceptional scenario in front of an assessment panel.',
                  badge: 'Exam',
                },
                {
                  title: 'Official certificate',
                  description: 'Issuance of the SI.Groupe STU certificate.',
                  badge: 'Diploma',
                },
              ],
            },
            sessions: {
              subtitle: 'STU',
            },
          },
          entreprise: {
            stats1: {
              durationTotal: '14h',
              durationBadge: '2d',
              durationText: 'full course',
              traineesTotal: '4-10',
              priceTotal: 'On quote',
              priceBadge: 'QUOTE',
              priceText: 'contact us',
              priceSuffix: '',
              successTotal: '99%',
              successBadge: '99%',
            },
            programStats: { standard: '2d', total: '14h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'YES',
              funding: '100%',
              recycle: '24 months',
              validity: '2 years',
              recycleLabel: 'Refresher',
              validityLabel: 'Certificate validity',
            },
            modules: sstModulesEn,
            prerequisites: {
              rows: [
                { item: 'Certification', detail: 'No prior diploma required', importance: 'Essential' },
                { item: 'French', detail: 'Ability to communicate in French', importance: 'Required' },
                { item: 'Health', detail: 'Physical ability to perform first-aid actions', importance: 'Mandatory' },
              ],
            },
            presentation: {
              title: 'Corporate SST',
              intro:
                'Session delivered directly at your site and tailored to your activity-specific risks.',
              suffix: 'Compliant with INRS reference documents.',
              bullets: [
                'Protect, Assess, Alert',
                'Assist the casualty',
                'Occupational risk prevention',
                'AED use',
              ],
              badge: 'Qualiopi certified',
            },
            loyalty: {
              title: 'SST',
              subtitle: 'First aid',
              description: 'The INRS benchmark for workplace first aid.',
              audience: {
                title: 'Target audience',
                subtitle: 'Learners',
                value: 'Employees (in-house)',
              },
              prerequisites: {
                title: 'Prerequisites',
                subtitle: 'Entry requirements',
                value: 'None',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Body / Standard',
                badge: 'INRS',
                value: 'SST',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Continuous assessment',
                  description:
                    'Validation of practical actions throughout the training with real-life scenarios.',
                  badge: 'Tracking',
                },
                {
                  title: 'Certification assessment',
                  description: 'Simulated workplace accident scenario based on INRS standards.',
                  badge: 'Exam',
                },
                {
                  title: 'Official certificate',
                  description:
                    'Issuance of the SST certificate (PSC1 equivalence) recognized by French Health Insurance.',
                  badge: 'Diploma',
                },
              ],
            },
            sessions: {
              subtitle: 'Corporate SST',
            },
          },
        },
      },
    },
  },
};
