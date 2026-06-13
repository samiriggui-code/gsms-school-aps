const habModulesFr = {
  h0b0: [
    {
      id: 'MOD1',
      title: "Notions élémentaires d'électricité",
      details: [
        "Différence de potentiel, intensité, résistance, loi d'Ohm.",
        'Effets du courant électrique sur le corps humain.',
      ],
    },
    {
      id: 'MOD2',
      title: 'Sensibilisation aux risques électriques',
      details: ['Responsabilités et obligations.', 'Statistiques et typologie des accidents.'],
    },
    {
      id: 'MOD3',
      title: 'Prévention des risques électriques',
      details: [
        'Moyens de protection directe/indirecte.',
        "Conduite à tenir en cas d'accident.",
      ],
    },
    {
      id: 'MOD4',
      title: 'Normes et définitions (NF C 18-510)',
      details: ['Prescriptions applicables au personnel.', 'Définitions essentielles.'],
    },
    {
      id: 'MOD5',
      title: "Opérations dans l'environnement électrique",
      details: ['Zones de voisinage.', 'Évaluation des risques et comportements adaptés.'],
    },
  ],
  br: [
    {
      id: 'MOD1',
      title: "Bases de l'électricité",
      details: ['Domaines de tension, distances de sécurité.', 'Grandeurs électriques, types de courant.'],
    },
    {
      id: 'MOD2',
      title: 'Sensibilisation aux risques électriques',
      details: ['Statistiques, effets du courant sur le corps.', 'Responsabilités des acteurs.'],
    },
    {
      id: 'MOD3',
      title: "Opérations dans l'environnement électrique",
      details: ['Zones d’environnement.', 'Travaux au voisinage, règles de sécurité.'],
    },
    {
      id: 'MOD4',
      title: 'Moyens de protection',
      details: [
        'Équipements de protection individuelle (EPI).',
        'Équipements de protection collective (EPC).',
      ],
    },
    {
      id: 'MOD5',
      title: 'Mise en sécurité et consignation',
      details: ['Procédures de consignation et déconsignation.', 'Attestation de mise hors tension.'],
    },
  ],
  bsBe: [
    {
      id: 'MOD1',
      title: "Notions élémentaires d'électricité",
      details: ["Le courant électrique.", "Les dangers de l'électricité."],
    },
    {
      id: 'MOD2',
      title: 'Risques électriques',
      details: ['Analyse des risques spécifiques.', 'Distances de sécurité.'],
    },
    {
      id: 'MOD3',
      title: 'Manoeuvres et interventions simples',
      details: ['Remplacement de fusibles, lampes.', 'Raccordement de matériel simple.'],
    },
    {
      id: 'MOD4',
      title: 'Moyens de protection',
      details: ['EPI et outillage électro-portatif.', 'Utilisation conforme du matériel.'],
    },
  ],
};

const habModulesEn = {
  h0b0: [
    {
      id: 'MOD1',
      title: 'Basic electrical principles',
      details: ["Voltage, current, resistance, Ohm's law.", 'Electrical current effects on the human body.'],
    },
    {
      id: 'MOD2',
      title: 'Electrical risk awareness',
      details: ['Responsibilities and obligations.', 'Accident statistics and patterns.'],
    },
    {
      id: 'MOD3',
      title: 'Electrical risk prevention',
      details: ['Direct/indirect protection methods.', 'Response procedure in case of accident.'],
    },
    {
      id: 'MOD4',
      title: 'Standards and definitions (NF C 18-510)',
      details: ['Requirements for staff.', 'Key definitions.'],
    },
    {
      id: 'MOD5',
      title: 'Operations near electrical environments',
      details: ['Proximity zones.', 'Risk assessment and appropriate behaviors.'],
    },
  ],
  br: [
    {
      id: 'MOD1',
      title: 'Electrical fundamentals',
      details: ['Voltage domains and safety distances.', 'Electrical quantities and current types.'],
    },
    {
      id: 'MOD2',
      title: 'Electrical risk awareness',
      details: ['Statistics and body effects.', 'Stakeholder responsibilities.'],
    },
    {
      id: 'MOD3',
      title: 'Operations near electrical environments',
      details: ['Environmental zones.', 'Nearby work and safety rules.'],
    },
    {
      id: 'MOD4',
      title: 'Protection equipment',
      details: ['Personal protective equipment (PPE).', 'Collective protective equipment.'],
    },
    {
      id: 'MOD5',
      title: 'Securing and lockout procedures',
      details: ['Lockout/tagout procedures.', 'Power-off certification.'],
    },
  ],
  bsBe: [
    {
      id: 'MOD1',
      title: 'Basic electrical principles',
      details: ['Electrical current basics.', 'Electrical hazards.'],
    },
    {
      id: 'MOD2',
      title: 'Electrical risks',
      details: ['Specific risk analysis.', 'Safety distances.'],
    },
    {
      id: 'MOD3',
      title: 'Simple operations and maneuvers',
      details: ['Fuse/lamp replacement.', 'Simple equipment connection.'],
    },
    {
      id: 'MOD4',
      title: 'Protection equipment',
      details: ['PPE and handheld electrical tools.', 'Proper equipment use.'],
    },
  ],
};

export const sheetContentHabilitationMessages = {
  fr: {
    landing: {
      sheetContent: {
        habilitation: {
          h0b0: {
            stats1: {
              durationTotal: '7h',
              durationBadge: '1j',
              durationText: 'formation complète',
              traineesTotal: '1-12',
              priceTotal: '125',
              priceBadge: 'EUR',
              priceText: 'à partir de',
              priceSuffix: '€',
              successTotal: '98%',
              successBadge: '99%',
            },
            programStats: { standard: '1j', total: '7h', theory: '30%', practice: '70%' },
            prerequisiteStats: {
              cpf: 'OUI',
              funding: '100%',
              recycle: '3 ans',
              validity: '3 ans',
              recycleLabel: 'Recyclage conseillé',
              validityLabel: 'Validité Titre',
            },
            modules: habModulesFr.h0b0,
            prerequisites: {
              rows: [
                { item: 'Électricité', detail: 'Aucune connaissance préalable', importance: 'Requis' },
                { item: 'Français', detail: 'Savoir lire et écrire en français', importance: 'Indispensable' },
                { item: 'Aptitude', detail: 'Pas de contre-indication médicale', importance: 'Obligatoire' },
              ],
            },
            presentation: {
              title: 'Habilitation H0/B0',
              intro:
                "Formation destinée au personnel non-électricien réalisant des opérations d'ordre non électrique à proximité d'installations.",
              suffix:
                'Conforme à la norme NF C 18-510 garantissant la sécurité lors des opérations électriques.',
              bullets: [
                'Analyse des risques électriques',
                'Mesures de prévention et protection',
                "Conduite à tenir en cas d'accident",
                'Mise en situation pratique',
              ],
              badge: 'Certifié Qualiopi',
            },
            loyalty: {
              title: 'H0/B0',
              subtitle: 'Habilitation',
              description:
                'Formation obligatoire pour garantir la sécurité électrique sur le lieu de travail.',
              audience: {
                title: 'Public concerné',
                subtitle: 'Bénéficiaires',
                value: 'Tout personnel non-élec',
              },
              prerequisites: {
                title: 'Prérequis',
                subtitle: "Conditions d'accès",
                value: 'Aucun',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Norme de référence',
                badge: 'NF C',
                value: '18-510',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Évaluation Théorique',
                  description:
                    'QCM de validation des acquis sur les risques électriques et les distances de sécurité.',
                  badge: 'Test',
                },
                {
                  title: 'Évaluation Pratique',
                  description:
                    'Mise en situation réelle ou simulée sur une installation électrique pour valider les procédures.',
                  badge: 'Pratique',
                },
                {
                  title: 'Attestation de Formation',
                  description:
                    "Délivrance de l'attestation NF C 18-510 permettant à l'employeur d'habiliter le salarié.",
                  badge: 'Attestation',
                },
              ],
            },
            sessions: {
              subtitle: 'Habilitation H0/B0',
            },
          },
          br: {
            stats1: {
              durationTotal: '21h',
              durationBadge: '3j',
              durationText: 'formation complète',
              traineesTotal: '1-12',
              priceTotal: '290',
              priceBadge: 'EUR',
              priceText: 'à partir de',
              priceSuffix: '€',
              successTotal: '98%',
              successBadge: '99%',
            },
            programStats: { standard: '3j', total: '21h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'OUI',
              funding: '100%',
              recycle: '3 ans',
              validity: '3 ans',
              recycleLabel: 'Recyclage conseillé',
              validityLabel: 'Validité Titre',
            },
            modules: habModulesFr.br,
            prerequisites: {
              rows: [
                { item: 'Électricité', detail: 'Être électricien ou titulaire H0/B0', importance: 'Requis' },
                { item: 'Français', detail: 'Savoir lire et écrire en français', importance: 'Indispensable' },
                { item: 'Aptitude', detail: 'Pas de contre-indication médicale', importance: 'Obligatoire' },
              ],
            },
            presentation: {
              title: 'Habilitation BR',
              intro:
                'Formation pour techniciens réalisant des interventions en basse tension (dépannage, connexion) nécessitant la consignation.',
              suffix:
                'Conforme à la norme NF C 18-510 garantissant la sécurité lors des opérations électriques.',
              bullets: [
                'Analyse des risques électriques',
                'Mesures de prévention et protection',
                "Conduite à tenir en cas d'accident",
                'Mise en situation pratique',
              ],
              badge: 'Certifié Qualiopi',
            },
            loyalty: {
              title: 'BR',
              subtitle: 'Habilitation',
              description:
                'Formation obligatoire pour garantir la sécurité électrique sur le lieu de travail.',
              audience: {
                title: 'Public concerné',
                subtitle: 'Bénéficiaires',
                value: 'Techniciens / Électriciens',
              },
              prerequisites: {
                title: 'Prérequis',
                subtitle: "Conditions d'accès",
                value: 'H0/B0 ou Élec',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Norme de référence',
                badge: 'NF C',
                value: '18-510',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Évaluation Théorique',
                  description:
                    'QCM de validation des acquis sur les risques électriques et les distances de sécurité.',
                  badge: 'Test',
                },
                {
                  title: 'Évaluation Pratique',
                  description:
                    'Mise en situation réelle ou simulée sur une installation électrique pour valider les procédures.',
                  badge: 'Pratique',
                },
                {
                  title: 'Attestation de Formation',
                  description:
                    "Délivrance de l'attestation NF C 18-510 permettant à l'employeur d'habiliter le salarié.",
                  badge: 'Attestation',
                },
              ],
            },
            sessions: {
              subtitle: 'Habilitation BR',
            },
          },
          bsBe: {
            stats1: {
              durationTotal: '14h',
              durationBadge: '2j',
              durationText: 'formation complète',
              traineesTotal: '1-12',
              priceTotal: '220',
              priceBadge: 'EUR',
              priceText: 'à partir de',
              priceSuffix: '€',
              successTotal: '98%',
              successBadge: '99%',
            },
            programStats: { standard: '2j', total: '14h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'OUI',
              funding: '100%',
              recycle: '3 ans',
              validity: '3 ans',
              recycleLabel: 'Recyclage conseillé',
              validityLabel: 'Validité Titre',
            },
            modules: habModulesFr.bsBe,
            prerequisites: {
              rows: [
                { item: 'Électricité', detail: 'Aucune connaissance préalable', importance: 'Requis' },
                { item: 'Français', detail: 'Savoir lire et écrire en français', importance: 'Indispensable' },
                { item: 'Aptitude', detail: 'Pas de contre-indication médicale', importance: 'Obligatoire' },
              ],
            },
            presentation: {
              title: 'Habilitation BS / BE Manoeuvre',
              intro:
                'Habilitation pour réaliser des opérations simples ou des manoeuvres de réarmement en basse tension.',
              suffix:
                'Conforme à la norme NF C 18-510 garantissant la sécurité lors des opérations électriques.',
              bullets: [
                'Analyse des risques électriques',
                'Mesures de prévention et protection',
                "Conduite à tenir en cas d'accident",
                'Mise en situation pratique',
              ],
              badge: 'Certifié Qualiopi',
            },
            loyalty: {
              title: 'BS / BE',
              subtitle: 'Habilitation',
              description:
                'Formation obligatoire pour garantir la sécurité électrique sur le lieu de travail.',
              audience: {
                title: 'Public concerné',
                subtitle: 'Bénéficiaires',
                value: 'Personnel technique',
              },
              prerequisites: {
                title: 'Prérequis',
                subtitle: "Conditions d'accès",
                value: 'Aucun',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Norme de référence',
                badge: 'NF C',
                value: '18-510',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Évaluation Théorique',
                  description:
                    'QCM de validation des acquis sur les risques électriques et les distances de sécurité.',
                  badge: 'Test',
                },
                {
                  title: 'Évaluation Pratique',
                  description:
                    'Mise en situation réelle ou simulée sur une installation électrique pour valider les procédures.',
                  badge: 'Pratique',
                },
                {
                  title: 'Attestation de Formation',
                  description:
                    "Délivrance de l'attestation NF C 18-510 permettant à l'employeur d'habiliter le salarié.",
                  badge: 'Attestation',
                },
              ],
            },
            sessions: {
              subtitle: 'Habilitation BS / BE Manoeuvre',
            },
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        habilitation: {
          h0b0: {
            stats1: {
              durationTotal: '7h',
              durationBadge: '1d',
              durationText: 'full course',
              traineesTotal: '1-12',
              priceTotal: '125',
              priceBadge: 'EUR',
              priceText: 'from',
              priceSuffix: '€',
              successTotal: '98%',
              successBadge: '99%',
            },
            programStats: { standard: '1d', total: '7h', theory: '30%', practice: '70%' },
            prerequisiteStats: {
              cpf: 'YES',
              funding: '100%',
              recycle: '3 years',
              validity: '3 years',
              recycleLabel: 'Recommended refresher',
              validityLabel: 'Certificate validity',
            },
            modules: habModulesEn.h0b0,
            prerequisites: {
              rows: [
                { item: 'Electrical background', detail: 'No prior knowledge required', importance: 'Required' },
                { item: 'French', detail: 'Ability to read and write in French', importance: 'Essential' },
                { item: 'Fitness', detail: 'No medical contraindication', importance: 'Mandatory' },
              ],
            },
            presentation: {
              title: 'H0/B0 Electrical Authorization',
              intro:
                'Course designed for non-electrical staff carrying out non-electrical operations near installations.',
              suffix:
                'Compliant with NF C 18-510 standard ensuring safety during electrical operations.',
              bullets: [
                'Electrical risk analysis',
                'Prevention and protection measures',
                'Incident response procedure',
                'Practical scenarios',
              ],
              badge: 'Qualiopi certified',
            },
            loyalty: {
              title: 'H0/B0',
              subtitle: 'Authorization',
              description: 'Mandatory training to ensure electrical safety in the workplace.',
              audience: {
                title: 'Target audience',
                subtitle: 'Learners',
                value: 'Any non-electrical staff',
              },
              prerequisites: {
                title: 'Prerequisites',
                subtitle: 'Entry requirements',
                value: 'None',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Reference standard',
                badge: 'NF C',
                value: '18-510',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Theory assessment',
                  description: 'MCQ validation on electrical risks and safety distances.',
                  badge: 'Test',
                },
                {
                  title: 'Practical assessment',
                  description:
                    'Real or simulated electrical installation scenario to validate procedures.',
                  badge: 'Practical',
                },
                {
                  title: 'Training certificate',
                  description:
                    'Issuance of NF C 18-510 certificate enabling employer authorization.',
                  badge: 'Certificate',
                },
              ],
            },
            sessions: {
              subtitle: 'H0/B0 authorization',
            },
          },
          br: {
            stats1: {
              durationTotal: '21h',
              durationBadge: '3d',
              durationText: 'full course',
              traineesTotal: '1-12',
              priceTotal: '290',
              priceBadge: 'EUR',
              priceText: 'from',
              priceSuffix: '€',
              successTotal: '98%',
              successBadge: '99%',
            },
            programStats: { standard: '3d', total: '21h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'YES',
              funding: '100%',
              recycle: '3 years',
              validity: '3 years',
              recycleLabel: 'Recommended refresher',
              validityLabel: 'Certificate validity',
            },
            modules: habModulesEn.br,
            prerequisites: {
              rows: [
                {
                  item: 'Electrical background',
                  detail: 'Must be electrician or hold H0/B0',
                  importance: 'Required',
                },
                { item: 'French', detail: 'Ability to read and write in French', importance: 'Essential' },
                { item: 'Fitness', detail: 'No medical contraindication', importance: 'Mandatory' },
              ],
            },
            presentation: {
              title: 'BR Electrical Authorization',
              intro:
                'Course for technicians performing low-voltage interventions requiring lockout procedures.',
              suffix:
                'Compliant with NF C 18-510 standard ensuring safety during electrical operations.',
              bullets: [
                'Electrical risk analysis',
                'Prevention and protection measures',
                'Incident response procedure',
                'Practical scenarios',
              ],
              badge: 'Qualiopi certified',
            },
            loyalty: {
              title: 'BR',
              subtitle: 'Authorization',
              description: 'Mandatory training to ensure electrical safety in the workplace.',
              audience: {
                title: 'Target audience',
                subtitle: 'Learners',
                value: 'Technicians / Electricians',
              },
              prerequisites: {
                title: 'Prerequisites',
                subtitle: 'Entry requirements',
                value: 'H0/B0 or electrical background',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Reference standard',
                badge: 'NF C',
                value: '18-510',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Theory assessment',
                  description: 'MCQ validation on electrical risks and safety distances.',
                  badge: 'Test',
                },
                {
                  title: 'Practical assessment',
                  description:
                    'Real or simulated electrical installation scenario to validate procedures.',
                  badge: 'Practical',
                },
                {
                  title: 'Training certificate',
                  description:
                    'Issuance of NF C 18-510 certificate enabling employer authorization.',
                  badge: 'Certificate',
                },
              ],
            },
            sessions: {
              subtitle: 'BR authorization',
            },
          },
          bsBe: {
            stats1: {
              durationTotal: '14h',
              durationBadge: '2d',
              durationText: 'full course',
              traineesTotal: '1-12',
              priceTotal: '220',
              priceBadge: 'EUR',
              priceText: 'from',
              priceSuffix: '€',
              successTotal: '98%',
              successBadge: '99%',
            },
            programStats: { standard: '2d', total: '14h', theory: '40%', practice: '60%' },
            prerequisiteStats: {
              cpf: 'YES',
              funding: '100%',
              recycle: '3 years',
              validity: '3 years',
              recycleLabel: 'Recommended refresher',
              validityLabel: 'Certificate validity',
            },
            modules: habModulesEn.bsBe,
            prerequisites: {
              rows: [
                { item: 'Electrical background', detail: 'No prior knowledge required', importance: 'Required' },
                { item: 'French', detail: 'Ability to read and write in French', importance: 'Essential' },
                { item: 'Fitness', detail: 'No medical contraindication', importance: 'Mandatory' },
              ],
            },
            presentation: {
              title: 'BS / BE Maneuver Authorization',
              intro:
                'Authorization to perform simple operations or low-voltage reset maneuvers.',
              suffix:
                'Compliant with NF C 18-510 standard ensuring safety during electrical operations.',
              bullets: [
                'Electrical risk analysis',
                'Prevention and protection measures',
                'Incident response procedure',
                'Practical scenarios',
              ],
              badge: 'Qualiopi certified',
            },
            loyalty: {
              title: 'BS / BE',
              subtitle: 'Authorization',
              description: 'Mandatory training to ensure electrical safety in the workplace.',
              audience: {
                title: 'Target audience',
                subtitle: 'Learners',
                value: 'Technical staff',
              },
              prerequisites: {
                title: 'Prerequisites',
                subtitle: 'Entry requirements',
                value: 'None',
              },
              certification: {
                title: 'Certification',
                subtitle: 'Reference standard',
                badge: 'NF C',
                value: '18-510',
              },
            },
            certification: {
              steps: [
                {
                  title: 'Theory assessment',
                  description: 'MCQ validation on electrical risks and safety distances.',
                  badge: 'Test',
                },
                {
                  title: 'Practical assessment',
                  description:
                    'Real or simulated electrical installation scenario to validate procedures.',
                  badge: 'Practical',
                },
                {
                  title: 'Training certificate',
                  description:
                    'Issuance of NF C 18-510 certificate enabling employer authorization.',
                  badge: 'Certificate',
                },
              ],
            },
            sessions: {
              subtitle: 'BS / BE maneuver authorization',
            },
          },
        },
      },
    },
  },
};
