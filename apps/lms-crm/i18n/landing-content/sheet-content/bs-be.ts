const bsBeModulesFr = [
  {
    id: 'MOD1',
    title: 'Environnement electrique',
    details: [
      'Notions de base sur le courant, les risques et les effets physiologiques.',
      'Zones de voisinage, signalisation et distances de securite.',
      'Cadre normatif NF C 18-510 et responsabilites de chacun.',
    ],
  },
  {
    id: 'MOD2',
    title: 'Operations BS / BE manoeuvre',
    details: [
      'Procedures de remplacement et rearmement en basse tension.',
      'Consignation simple et verification d absence de danger.',
      'Conduite a tenir en cas d anomalie ou incident electrique.',
    ],
  },
  {
    id: 'MOD3',
    title: 'Mises en situation',
    details: [
      'Exercices de manoeuvre et gestes securises sur installations type.',
      'Application des modes operatoires en contexte realiste.',
      'Debriefing collectif et actions correctives.',
    ],
  },
];

const bsBeModulesEn = [
  {
    id: 'MOD1',
    title: 'Electrical environment',
    details: [
      'Basic notions on current, risks and physiological effects.',
      'Proximity zones, signage and safety distances.',
      'NF C 18-510 framework and responsibilities.',
    ],
  },
  {
    id: 'MOD2',
    title: 'BS / BE maneuver operations',
    details: [
      'Low-voltage replacement and reset procedures.',
      'Simple lockout and danger checks.',
      'Response actions in case of electrical anomaly or incident.',
    ],
  },
  {
    id: 'MOD3',
    title: 'Practical scenarios',
    details: [
      'Maneuver drills and safe actions on sample installations.',
      'Application of operating modes in realistic contexts.',
      'Collective debrief and corrective actions.',
    ],
  },
];

export const sheetContentBsBeMessages = {
  fr: {
    landing: {
      sheetContent: {
        bsBe: {
          meta: {
            headline: 'Habilitation Electrique BS / BE Manoeuvre',
            track: 'Electrique',
            type: 'Habilitation NF C 18-510',
            duration: '1 a 2 jours',
            financingPrice: '290 €',
          },
          stats1: {
            durationTotal: '1-2j',
            durationBadge: '7-14h',
            durationText: 'formation complete',
            traineesTotal: '1-12',
            priceTotal: '290',
            priceBadge: 'EUR',
            priceText: 'a partir de',
            priceSuffix: '€',
            successTotal: '98%',
            successBadge: '99%',
          },
          stats2: [
            { total: '3', label: 'Modules cles' },
            { total: '7-14h', label: 'Volume indicatif' },
            { total: '40%', label: 'Theorie' },
            { total: '60%', label: 'Pratique' },
          ],
          stats4: {
            items: [
              { total: '18+', label: 'Age minimum recommande' },
              { total: 'Aucun', label: 'Pre-requis electrique' },
              { total: 'FR', label: 'Lecture des consignes' },
              { total: 'Aptitude', label: 'Aptitude medicale' },
            ],
          },
          modules: bsBeModulesFr,
          prerequisites: {
            rows: [
              {
                item: 'Connaissances electriques',
                detail: 'Aucune connaissance prealable exigee',
                importance: 'Requis',
              },
              {
                item: 'Francais',
                detail: 'Savoir lire et comprendre les consignes de securite',
                importance: 'Indispensable',
              },
              {
                item: 'Aptitude',
                detail: 'Pas de contre-indication medicale au poste',
                importance: 'Obligatoire',
              },
            ],
          },
          presentation: {
            title: 'Objectifs de la formation',
            intro:
              'Permettre au personnel non-electricien d effectuer des manoeuvres simples et des remplacements (fusibles, lampes) en toute securite dans un environnement electrique.',
            bullets: [
              'Identifier les risques electriques et les zones de danger',
              'Appliquer les gestes BS / BE manoeuvre conformes a la norme',
              'Adopter la bonne conduite en cas d incident',
            ],
            badge: 'Conforme NF C 18-510',
          },
          loyalty: {
            title: 'BS / BE',
            subtitle: 'Habilitation',
            description:
              'Formation essentielle pour intervenir en basse tension sur des operations elementaires en securite.',
            audience: {
              title: 'Public concerne',
              subtitle: 'Beneficiaires',
              value: 'Personnel non-electricien',
            },
            prerequisites: {
              title: 'Prerequis',
              subtitle: 'Conditions d acces',
              value: 'Aucun',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Norme de reference',
              badge: 'NF C',
              value: '18-510',
            },
          },
          certification: {
            steps: [
              {
                title: 'Evaluation theorique',
                description:
                  'Questionnaire de validation des acquis sur les risques electriques et les procedures de securite.',
                badge: 'Test',
              },
              {
                title: 'Evaluation pratique',
                description:
                  'Mises en situation BS / BE manoeuvre sur cas types encadres par le formateur.',
                badge: 'Pratique',
              },
              {
                title: 'Attestation de formation',
                description:
                  'Remise d une attestation permettant a l employeur de delivrer l habilitation interne.',
                badge: 'Attestation',
              },
            ],
          },
          sessions: {
            title: 'Sessions sur demande',
            subtitle: 'Dates planifiees selon vos disponibilites',
            badge: 'Planifiable',
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        bsBe: {
          meta: {
            headline: 'BS / BE maneuver electrical authorization',
            track: 'Electrical',
            type: 'NF C 18-510 authorization',
            duration: '1 to 2 days',
            financingPrice: '290 €',
          },
          stats1: {
            durationTotal: '1-2d',
            durationBadge: '7-14h',
            durationText: 'full training',
            traineesTotal: '1-12',
            priceTotal: '290',
            priceBadge: 'EUR',
            priceText: 'from',
            priceSuffix: '€',
            successTotal: '98%',
            successBadge: '99%',
          },
          stats2: [
            { total: '3', label: 'Key modules' },
            { total: '7-14h', label: 'Indicative volume' },
            { total: '40%', label: 'Theory' },
            { total: '60%', label: 'Practice' },
          ],
          stats4: {
            items: [
              { total: '18+', label: 'Recommended minimum age' },
              { total: 'None', label: 'Electrical background' },
              { total: 'FR', label: 'Safety instructions reading' },
              { total: 'Fitness', label: 'Medical fitness' },
            ],
          },
          modules: bsBeModulesEn,
          prerequisites: {
            rows: [
              {
                item: 'Electrical background',
                detail: 'No prior electrical knowledge required',
                importance: 'Required',
              },
              {
                item: 'French',
                detail: 'Ability to read and understand safety instructions',
                importance: 'Essential',
              },
              {
                item: 'Fitness',
                detail: 'No medical contraindication for the role',
                importance: 'Mandatory',
              },
            ],
          },
          presentation: {
            title: 'Training objectives',
            intro:
              'Enable non-electrical staff to perform simple maneuvers and replacements (fuses, lamps) safely in an electrical environment.',
            bullets: [
              'Identify electrical risks and danger zones',
              'Apply BS / BE maneuver actions compliant with the standard',
              'Use the correct response in case of incident',
            ],
            badge: 'NF C 18-510 compliant',
          },
          loyalty: {
            title: 'BS / BE',
            subtitle: 'Authorization',
            description:
              'Essential training to perform basic low-voltage operations safely.',
            audience: {
              title: 'Target audience',
              subtitle: 'Learners',
              value: 'Non-electrical staff',
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
                description:
                  'Knowledge check on electrical risks and safety procedures.',
                badge: 'Test',
              },
              {
                title: 'Practical assessment',
                description:
                  'BS / BE maneuver scenarios supervised by the instructor.',
                badge: 'Practical',
              },
              {
                title: 'Training certificate',
                description:
                  'Issuance of certificate enabling employer internal authorization.',
                badge: 'Certificate',
              },
            ],
          },
          sessions: {
            title: 'On-demand sessions',
            subtitle: 'Dates scheduled according to your availability',
            badge: 'Can be scheduled',
          },
        },
      },
    },
  },
};
