'use strict';

/**
 * Seed catalogue Formation + FormationSession à partir du snapshot JSON
 * (généré depuis apps/lms-crm/.../formation-vitrine-catalog.ts — garder les deux alignés).
 *
 * Regénérer le snapshot :
 *   cd apps/lms-crm && npx tsx -e "import { writeFileSync } from 'fs'; import { FORMATION_VITRINE_CATALOG, FORMATION_CATALOG_PROGRAM_BY_SLUG } from './app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog.ts'; writeFileSync('../../packages/database/prisma/data/formations-catalog.snapshot.json', JSON.stringify({ catalog: FORMATION_VITRINE_CATALOG, programBySlug: FORMATION_CATALOG_PROGRAM_BY_SLUG }, null, 2));"
 */

const snapshot = require('./formations-catalog.snapshot.json');
const tfpProgramModules = require('./formations-tfp-program.json');
const { logoPublicUrlForFormationSlug } = require('./formation-logo-urls');
const { FORMATION_VENUE_ROOMS } = require('./formation-venue-rooms-seed');

const PROVIDER = {
  logoUrl: logoPublicUrlForFormationSlug('tfp-aps'),
  providerName: "Form'SSI",
  providerEmail: 'contact@form-ssi.fr',
  providerPhone: '01 71 11 39 63',
  providerAddress: '9 AV Alexandre Maistrasse, 92500 Rueil-Malmaison',
};

const DEFAULT_FUNDING_BLOCKS = [
  {
    label: 'Entreprise',
    info: 'Plan de développement des compétences, CPF cofinancé ou via OPCO.',
  },
  {
    label: 'CPF',
    info: 'Utilisation de vos droits acquis sur Mon Compte Formation (organisme certifié).',
  },
  {
    label: 'Individuel',
    info: 'Ressources personnelles avec possibilité de paiement échelonné.',
  },
  {
    label: 'France Travail',
    info: "AIF (Aide Individuelle à la Formation) pour demandeurs d'emploi.",
  },
];

const DEFAULT_FUNDING_CHANNELS = [
  {
    logo: '/media/formations/2600x1600/compte-formation.jpg',
    name: 'Mon Compte Formation (CPF)',
    details: 'Utilisez vos droits à la formation',
    isPrimary: true,
  },
  {
    logo: '/media/formations/2600x1600/logo-france-travail_0.jpg-1-500x313.png',
    name: 'France Travail (Pôle Emploi)',
    details: 'Aide Individuelle à la Formation (AIF)',
    isPrimary: false,
  },
  {
    logo: '/media/formations/2600x1600/opco.png',
    name: 'Financement Entreprise',
    details: 'OPCO et Plan de développement',
    isPrimary: false,
  },
  {
    logo: null,
    iconKey: 'banknote',
    name: 'Financement Individuel',
    details: 'Paiement personnel (échelonnement possible)',
    isPrimary: false,
  },
];

const TFP_PREREQUISITES_TABLE = [
  {
    item: 'Âge',
    detail: 'Être majeur (18 ans révolus)',
    importance: 'Obligatoire',
  },
  {
    item: 'Moralité',
    detail: 'Casier judiciaire vierge (enquête administrative)',
    importance: 'Critique',
  },
  {
    item: 'CNAPS',
    detail: "Numéro d'autorisation préalable ou carte pro en cours",
    importance: 'Indispensable',
  },
  {
    item: 'Langue',
    detail: 'Maîtrise du français (niveau B1 minimum)',
    importance: 'Requis',
  },
  {
    item: 'Savoir-être',
    detail: 'Ponctualité, rigueur et présentation correcte',
    importance: 'Essentiel',
  },
];

const TFP_OVERVIEW_METRICS = [
  {
    total: '175h',
    label: "Nombre d'heures",
    badgeLabel: 'Min',
    badgeColor: 'success',
    text: 'formation certifiante',
    number: '',
  },
  {
    total: '4-12',
    label: 'Effectif stagiaires',
    badgeLabel: 'Pers.',
    badgeColor: 'success',
    text: 'par session',
    number: '',
  },
  {
    total: '1190',
    label: 'Prix de la formation',
    badgeLabel: 'EUR',
    badgeColor: 'warning',
    text: 'à partir de',
    number: '€',
  },
  {
    total: '97%',
    label: 'Taux de réussite',
    badgeLabel: '94%',
    badgeColor: 'success',
    text: 'satisfaction client',
    number: '',
  },
];

const TFP_CERTIFICATION_STEPS = [
  {
    title: 'Évaluation continue',
    description:
      'Mise en situation et exercices pratiques tout au long de la formation (PC de sécurité, rondes, interventions).',
    badge: 'Pratique',
    iconKey: 'clipboard-check',
  },
  {
    title: 'Examen Théorique (QCU)',
    description:
      "Questionnaire à Choix Unique pour valider l'acquisition des connaissances théoriques sur l'ensemble des modules.",
    badge: 'Théorie',
    iconKey: 'check-circle',
  },
  {
    title: 'Certification Finale',
    description:
      'Validation devant un jury de professionnels pour la certification, permettant de demander la carte CNAPS.',
    badge: 'Diplôme',
    iconKey: 'graduation-cap',
  },
];

/** Sessions onglet CRM card-date.tsx — dates ISO pour tri / filtres */
const TFP_VITRINE_SESSIONS = [
  {
    dateDisplayLabel: '04 Mai au 12 Juin 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'WITH_EXAM',
    startDate: new Date('2026-05-04T00:00:00.000Z'),
    endDate: new Date('2026-06-12T23:59:59.999Z'),
    sortOrder: 0,
  },
  {
    dateDisplayLabel: '18 Mai au 22 Juin 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-05-18T00:00:00.000Z'),
    endDate: new Date('2026-06-22T23:59:59.999Z'),
    sortOrder: 1,
  },
  {
    dateDisplayLabel: '26 Mai au 30 Juin 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-05-26T00:00:00.000Z'),
    endDate: new Date('2026-06-30T23:59:59.999Z'),
    sortOrder: 2,
  },
  {
    dateDisplayLabel: '06 Juil au 11 Août 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'WITH_EXAM',
    startDate: new Date('2026-07-06T00:00:00.000Z'),
    endDate: new Date('2026-08-11T23:59:59.999Z'),
    sortOrder: 3,
  },
  {
    dateDisplayLabel: '07 Sep au 09 Oct 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-09-07T00:00:00.000Z'),
    endDate: new Date('2026-10-09T23:59:59.999Z'),
    sortOrder: 4,
  },
  {
    dateDisplayLabel: '21 Sep au 26 Oct 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-09-21T00:00:00.000Z'),
    endDate: new Date('2026-10-26T23:59:59.999Z'),
    sortOrder: 5,
  },
  {
    dateDisplayLabel: '28 Sep au 30 Oct 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-09-28T00:00:00.000Z'),
    endDate: new Date('2026-10-30T23:59:59.999Z'),
    sortOrder: 6,
  },
  {
    dateDisplayLabel: '16 Nov au 21 Déc 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-11-16T00:00:00.000Z'),
    endDate: new Date('2026-12-21T23:59:59.999Z'),
    sortOrder: 7,
  },
  {
    dateDisplayLabel: '16 Nov au 18 Déc 2026',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-11-16T00:00:00.000Z'),
    endDate: new Date('2026-12-18T23:59:59.999Z'),
    sortOrder: 8,
  },
  {
    dateDisplayLabel: '30 Nov 2026 au 18 Jan 2027',
    location: 'Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-11-30T00:00:00.000Z'),
    endDate: new Date('2027-01-18T23:59:59.999Z'),
    sortOrder: 9,
  },
];

/**
 * Démo CRM : sessions catalogue pour « SSIAP 1 Initial ».
 * (Seul `tfp-aps` avait des sessions vitrine ; sans ceci la liste CRM ne montre aucune session SSIAP.)
 */
const SSIAP1_INITIAL_VITRINE_SESSIONS = [
  {
    dateDisplayLabel: '13/06/2026',
    location: '5 avenue Alexandre Maistrasse, 92500 Rueil-Malmaison',
    sessionKind: 'INITIAL',
    startDate: new Date('2026-06-15T08:00:00.000Z'),
    endDate: new Date('2026-06-27T15:00:00.000Z'),
    sortOrder: 0,
    traineesMin: 6,
    traineesMax: 12,
  },
];

function parseHours(duration) {
  if (!duration || typeof duration !== 'string') return { min: null, max: null };
  const d = duration.replace(/\u00a0/g, ' ').trim();
  let m = d.match(/(\d+)\s*h\s*[àa]\s*(\d+)/i);
  if (m) return { min: Number(m[1]), max: Number(m[2]) };
  m = d.match(/(\d+)\s*h\s*(?:\(|minimum|$)/i);
  if (m) return { min: Number(m[1]), max: Number(m[1]) };
  m = d.match(/\((\d+)\s*h/i);
  if (m) return { min: Number(m[1]), max: Number(m[1]) };
  m = d.match(/(\d+)\s*h\s*\/\s*24\s*mois/i);
  if (m) return { min: Number(m[1]), max: Number(m[1]) };
  m = d.match(/(\d+)\s*a\s*(\d+)\s*semaines/i);
  if (m) {
    return { min: Number(m[1]) * 35, max: Number(m[2]) * 35 };
  }
  m = d.match(/(\d+(?:[.,]\d+)?)\s*a\s*(\d+(?:[.,]\d+)?)\s*jours/i);
  if (m) {
    const a = Number(String(m[1]).replace(',', '.'));
    const b = Number(String(m[2]).replace(',', '.'));
    return { min: Math.round(a * 7), max: Math.round(b * 8) };
  }
  m = d.match(/^(\d+)\s*jour(?:s)?\b/i);
  if (m) {
    const days = Number(m[1]);
    return { min: days * 7, max: days * 8 };
  }
  m = d.match(/(\d+)\s*h\s*30\b/i);
  if (m) {
    const whole = Number(m[1]);
    return { min: whole + 0.5, max: whole + 0.5 };
  }
  return { min: null, max: null };
}

/** Effectifs par session : toujours renseigné (DB + carte « vue d’ensemble » cohérents). */
function traineesIntervalForCatalog(item, hMin) {
  if (hMin != null && hMin >= 70) return { traineesMin: 4, traineesMax: 12 };
  if (hMin != null && hMin >= 14) return { traineesMin: 4, traineesMax: 12 };
  if (hMin != null && hMin >= 7) return { traineesMin: 6, traineesMax: 15 };
  if (hMin != null && hMin >= 3) return { traineesMin: 8, traineesMax: 18 };
  if (hMin != null) return { traineesMin: 10, traineesMax: 20 };
  if (item.track === 'entreprise') return { traineesMin: 10, traineesMax: 24 };
  if (item.track === 'habilitation' || item.track === 'sst') return { traineesMin: 6, traineesMax: 14 };
  return { traineesMin: 6, traineesMax: 14 };
}

function volumeHoursLabel(hMin, hMax, fallbackDuration) {
  if (hMin != null && hMax != null && hMin !== hMax) return `${hMin}-${hMax}h`;
  if (hMin != null) return `${hMin}h`;
  return fallbackDuration || '';
}

function theoryPracticePercent(hMin) {
  if (hMin != null && hMin >= 70) return { theoryPercent: 50, practicePercent: 50 };
  if (hMin != null && hMin >= 14) return { theoryPercent: 40, practicePercent: 60 };
  return { theoryPercent: 50, practicePercent: 50 };
}

function deliveryModeFor(item) {
  if (item.track === 'entreprise' && item.slug !== 'sst-entreprise') return 'ENTREPRISE_SUR_SITE';
  return 'PRESENTIEL';
}

function cnapsLike(item) {
  return (
    item.track === 'surete' ||
    item.tag === 'CNAPS' ||
    item.slug.includes('ssiap') ||
    item.slug.includes('aps') ||
    item.slug.includes('ovt') ||
    item.slug.includes('asra')
  );
}

function prerequisiteBand(item) {
  if (item.slug.includes('ssiap')) {
    return {
      minAgeLabel: '18+',
      frenchLevel: 'B1',
      authorizationSummary: 'SSIAP',
      criminalRecordRequirement: 'Vierge',
    };
  }
  if (cnapsLike(item)) {
    return {
      minAgeLabel: '18+',
      frenchLevel: 'B1',
      authorizationSummary: 'CNAPS',
      criminalRecordRequirement: 'Vierge',
    };
  }
  if (item.track === 'habilitation') {
    return {
      minAgeLabel: '18+',
      frenchLevel: 'Selon entreprise',
      authorizationSummary: 'Habilité encadrant',
      criminalRecordRequirement: 'Selon employeur',
    };
  }
  if (item.track === 'sst') {
    return {
      minAgeLabel: '16+',
      frenchLevel: 'Compréhension orale',
      authorizationSummary: 'INRS / référentiel SST',
      criminalRecordRequirement: 'N/A',
    };
  }
  return {
    minAgeLabel: '18+',
    frenchLevel: 'Français',
    authorizationSummary: 'Selon référentiel',
    criminalRecordRequirement: 'Selon entreprise',
  };
}

function defaultPrerequisitesTable(item) {
  const base = [
    {
      item: 'Âge',
      detail:
        item.track === 'sst' && item.slug !== 'stu'
          ? 'Âge conforme au référentiel SST (souvent 16 ans révolus selon contexte).'
          : 'Être majeur (18 ans révolus) ou dérogation conforme au référentiel.',
      importance: 'Obligatoire',
    },
    {
      item: 'Moralité',
      detail: 'Attestation et dossier conformes aux exigences du organisme et du référentiel.',
      importance: 'Critique',
    },
    {
      item: 'Référentiel',
      detail: `Parcours « ${item.name} » : pièces et niveau demandés au bulletin d'inscription.`,
      importance: 'Indispensable',
    },
    {
      item: 'Langue',
      detail: 'Compréhension et expression adaptées aux mises en situation du programme.',
      importance: 'Requis',
    },
    {
      item: 'Savoir-être',
      detail: 'Assiduité, posture professionnelle et respect des consignes de sécurité.',
      importance: 'Essentiel',
    },
  ];
  return base;
}

function buildProgramModulesFromCatalog(item) {
  return item.modules.map((title, i) => ({
    id: `UV${i + 1}`,
    title,
    details: [
      `Approfondissement des objectifs du module « ${title} ».`,
      'Conformité avec le référentiel et les objectifs pédagogiques du parcours.',
    ],
  }));
}

function genericOverviewMetrics(item, hMin, hMax, traineesMin, traineesMax) {
  const vol = volumeHoursLabel(hMin, hMax, item.duration);
  const priceLabel = hMin != null && hMin >= 50 ? 'Sur devis' : 'Sur devis';
  const effectifLabel = `${traineesMin}-${traineesMax}`;
  return [
    {
      total: vol || item.duration,
      label: "Nombre d'heures / volume",
      badgeLabel: 'Prog.',
      badgeColor: 'success',
      text: 'durée indicative',
      number: '',
    },
    {
      total: effectifLabel,
      label: 'Effectif stagiaires',
      badgeLabel: 'Pers.',
      badgeColor: 'success',
      text: 'par session',
      number: '',
    },
    {
      total: priceLabel,
      label: 'Prix de la formation',
      badgeLabel: 'EUR',
      badgeColor: 'warning',
      text: 'négocié selon financement',
      number: '',
    },
    {
      total: '92%',
      label: 'Taux de satisfaction',
      badgeLabel: '94%',
      badgeColor: 'success',
      text: 'retours stagiaires',
      number: '',
    },
  ];
}

function genericCertificationSteps(item) {
  return [
    {
      title: 'Mises en situation',
      description: `Exercices pratiques et scénarios adaptés au métier visé par « ${item.name} ».`,
      badge: 'Pratique',
      iconKey: 'clipboard-check',
    },
    {
      title: 'Évaluation des acquis',
      description:
        'Contrôles formatifs ou certificatifs selon le référentiel officiel du parcours.',
      badge: 'Théorie',
      iconKey: 'check-circle',
    },
    {
      title: 'Certification / attestation',
      description:
        item.outcomes && item.outcomes[0]
          ? `Validation des compétences menant à : ${item.outcomes[0]}.`
          : 'Validation des compétences selon le diplôme ou titre visé.',
      badge: 'Certificat',
      iconKey: 'graduation-cap',
    },
  ];
}

function complementaryDetailsFor(item, hoursParsed) {
  const firstOutcome = item.outcomes && item.outcomes[0] ? item.outcomes[0] : item.description.slice(0, 120);
  const axes = item.modules.slice(0, 5);
  while (axes.length < 5) axes.push(`Bloc ${axes.length + 1}`);
  return {
    commercialShortName: item.name,
    contentVersion: '1',
    progressAxisLabels: axes,
    targetAudience: {
      title: 'Public concerné',
      subtitle: 'Bénéficiaires',
      value: firstOutcome,
    },
    prerequisitesSummary: {
      title: 'Prérequis',
      subtitle: "Conditions d'accès",
      value: prerequisiteBand(item).authorizationSummary + ' — voir tableau détaillé.',
    },
    certificationSummary: {
      badgeLabel: item.tag || 'Référentiel',
      outcomeLabel: item.outcomes && item.outcomes[1] ? item.outcomes[1] : item.name,
    },
    deliveryModeLabel: deliveryModeFor(item) === 'ENTREPRISE_SUR_SITE' ? 'En entreprise' : 'En centre',
    hoursParsed,
  };
}

function financeDefaultsFor(item, hoursParsed) {
  const qualiopi =
    hoursParsed.min != null && hoursParsed.min >= 7 && item.parcoursSpecialite !== 'AUTRE';
  const cpf =
    item.track !== 'entreprise' ||
    item.slug === 'sst-entreprise' ||
    item.duration.includes('jour');
  const price =
    item.slug === 'tfp-aps'
      ? 1190
      : item.slug === 'asc-cynophile'
        ? null
      : hoursParsed.min != null && hoursParsed.min >= 140
        ? 890
        : hoursParsed.min != null && hoursParsed.min >= 40
          ? 590
          : null;
  return { qualiopiCertified: qualiopi, cpfEligible: cpf, priceFrom: price };
}

function buildFormationPayload(item, programConfig) {
  const hoursParsed = parseHours(item.duration);
  const { min: hMin, max: hMax } = hoursParsed;
  const { traineesMin, traineesMax } = traineesIntervalForCatalog(item, hMin);
  const tp = theoryPracticePercent(hMin);
  const prereq = prerequisiteBand(item);
  const fin = financeDefaultsFor(item, hoursParsed);

  const logoUrl = logoPublicUrlForFormationSlug(item.slug);
  let nextSessionLabel = 'Contact organisme pour les prochaines dates';
  if (item.slug === 'tfp-aps') {
    nextSessionLabel = 'Dès le 04 Mai 2026';
  } else if (item.slug === 'ssiap-1-initial') {
    nextSessionLabel = 'Dès le 13 Juin 2026';
  }

  const common = {
    slug: item.slug,
    name: item.name,
    description: item.description,
    track: item.track,
    tag: item.tag,
    duration: item.duration,
    parcoursSpecialite: item.parcoursSpecialite,
    status: 'ACTIVE',
    featured: item.featured,

    logoUrl,
    providerName: PROVIDER.providerName,
    providerEmail: PROVIDER.providerEmail,
    providerPhone: PROVIDER.providerPhone,
    providerAddress: PROVIDER.providerAddress,
    nextSessionLabel,

    cpfEligible: fin.cpfEligible,
    qualiopiCertified: fin.qualiopiCertified,
    rncpUrl: null,
    rncpCode: null,

    deliveryMode: deliveryModeFor(item),

    hoursMin: item.slug === 'tfp-aps' ? 175 : hMin ?? undefined,
    hoursMax: item.slug === 'tfp-aps' ? 175 : hMax ?? undefined,
    traineesMin,
    traineesMax,
    priceFrom: fin.priceFrom != null ? fin.priceFrom : undefined,
    currency: 'EUR',
    successRate: item.slug === 'tfp-aps' ? 97 : item.slug === 'asc-cynophile' ? 90 : 92,
    clientSatisfactionRate: item.slug === 'tfp-aps' ? 94 : item.slug === 'asc-cynophile' ? 88 : 90,

    unitsCount: item.modules.length,
    volumeHoursLabel: volumeHoursLabel(hMin, hMax, item.duration),
    theoryPercent: tp.theoryPercent,
    practicePercent: tp.practicePercent,

    minAgeLabel: prereq.minAgeLabel,
    frenchLevel: prereq.frenchLevel,
    authorizationSummary: prereq.authorizationSummary,
    criminalRecordRequirement: prereq.criminalRecordRequirement,

    presentationTitle: item.name,
    longDescription:
      item.slug === 'tfp-aps'
        ? "La formation TFP APS prépare à la surveillance, à la protection des biens et des personnes. Elle est obligatoire pour l'obtention de la carte professionnelle CNAPS. Répartition : 50% théorique / 50% pratique."
        : `${item.description}\n\nCompétences visées : ${(item.outcomes || []).join(' · ')}.`,

    modules: item.modules,
    outcomes: item.outcomes,
    presentationBullets:
      item.slug === 'tfp-aps'
        ? [
            '- UV1 à UV14 : Programme complet de sécurité privée',
            '- Secourisme, Juridique, Gestion des conflits',
            '- Prévention des risques terroristes et incendie',
            '- Surveillance humaine et moyens électroniques',
          ]
        : item.modules.map((m) => `- ${m}`),

    catalogProgramConfig: programConfig,

    courseId: null,
  };

  if (item.slug === 'tfp-aps') {
    Object.assign(common, {
      programModules: tfpProgramModules,
      prerequisitesTable: TFP_PREREQUISITES_TABLE,
      fundingBlocks: DEFAULT_FUNDING_BLOCKS,
      fundingChannels: DEFAULT_FUNDING_CHANNELS,
      overviewMetrics: TFP_OVERVIEW_METRICS,
      certificationSteps: TFP_CERTIFICATION_STEPS,
      complementaryDetails: {
        commercialShortName: 'TFP APS',
        contentVersion: 'Version 1',
        progressAxisLabels: ['Secourisme', 'Juridique', 'Conflits', 'Professionnel', 'Risque'],
        targetAudience: {
          title: 'Public concerné',
          subtitle: 'Bénéficiaires',
          value: 'Futurs agents APS',
        },
        prerequisitesSummary: {
          title: 'Prérequis',
          subtitle: "Conditions d'accès",
          value: 'Majeur + CNAPS + B1',
        },
        certificationSummary: {
          badgeLabel: 'CNAPS',
          outcomeLabel: 'Carte pro APS',
        },
        deliveryModeLabel: 'En centre',
      },
      rncpUrl: null,
      cpfEligible: true,
      qualiopiCertified: true,
    });
  } else {
    Object.assign(common, {
      programModules: buildProgramModulesFromCatalog(item),
      prerequisitesTable: defaultPrerequisitesTable(item),
      fundingBlocks: DEFAULT_FUNDING_BLOCKS,
      fundingChannels: DEFAULT_FUNDING_CHANNELS,
      overviewMetrics: genericOverviewMetrics(item, hMin, hMax, traineesMin, traineesMax),
      certificationSteps: genericCertificationSteps(item),
      complementaryDetails: complementaryDetailsFor(item, hoursParsed),
    });
  }

  const sessions =
    item.slug === 'tfp-aps'
      ? TFP_VITRINE_SESSIONS.map((s, i) => ({
          dateDisplayLabel: s.dateDisplayLabel,
          location: s.location,
          sessionKind: s.sessionKind,
          venueBrandPrefix: PROVIDER.providerName,
          sessionSubtitle: `Formation ${item.name}`,
          sortOrder: s.sortOrder,
          startDate: s.startDate,
          endDate: s.endDate,
          bookingEnabled: false,
          bookingUrl: null,
          venueRoom: {
            connect: { id: FORMATION_VENUE_ROOMS[i % FORMATION_VENUE_ROOMS.length].id },
          },
        }))
      : item.slug === 'ssiap-1-initial'
        ? SSIAP1_INITIAL_VITRINE_SESSIONS.map((s, i) => ({
            dateDisplayLabel: s.dateDisplayLabel,
            location: s.location,
            sessionKind: s.sessionKind,
            venueBrandPrefix: PROVIDER.providerName,
            sessionSubtitle: `Formation ${item.name}`,
            sortOrder: s.sortOrder,
            startDate: s.startDate,
            endDate: s.endDate,
            traineesMin: s.traineesMin,
            traineesMax: s.traineesMax,
            bookingEnabled: false,
            bookingUrl: null,
            venueRoom: {
              connect: { id: FORMATION_VENUE_ROOMS[i % FORMATION_VENUE_ROOMS.length].id },
            },
          }))
        : [];

  return { data: common, sessions };
}

async function seedFormationsCatalog(tx) {
  const { catalog, programBySlug } = snapshot;
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('formations-catalog.snapshot.json : catalogue vide ou invalide.');
  }

  await tx.formation.deleteMany({});

  for (const item of catalog) {
    const programConfig = programBySlug[item.slug];
    if (!programConfig) {
      throw new Error(`programBySlug manquant pour slug=${item.slug}`);
    }
    const { data, sessions } = buildFormationPayload(item, programConfig);
    await tx.formation.create({
      data: {
        ...data,
        ...(sessions.length
          ? {
              sessions: {
                create: sessions,
              },
            }
          : {}),
      },
    });
  }

  console.log(
    `Formations catalogue : ${catalog.length} ligne(s) + sessions vitrine (TFP APS, SSIAP 1 initial).`,
  );

  /** Références laissées hors catalogue pour la démo « Ajouter au catalogue » (liste bibliothèque non vide). */
  const SLUGS_WITHOUT_PRESEEDED_OFFER = new Set([
    'guide-file-serre-file',
    'ari',
    'manipulation-extincteur',
    'esi',
    'ssi',
    'cssi',
    'evacuation-incendie',
    'epi',
    'commission-securite',
    'intra-entreprise-securite',
  ]);

  const inserted = await tx.formation.findMany({ select: { id: true, slug: true } });
  let offersCount = 0;
  for (const row of inserted) {
    if (SLUGS_WITHOUT_PRESEEDED_OFFER.has(row.slug)) continue;
    await tx.formationCatalogOffer.upsert({
      where: { formationId: row.id },
      create: { formationId: row.id, catalogStatus: 'ACTIVE' },
      update: {},
    });
    offersCount += 1;
  }
  console.log(
    `FormationCatalogOffer : ${offersCount} offre(s) pré-remplies ; ${SLUGS_WITHOUT_PRESEEDED_OFFER.size} fiche(s) restent ajoutables depuis la bibliothèque.`,
  );
}

module.exports = {
  seedFormationsCatalog,
};
