const autresModulesFr = {
  commission: [
    {
      id: 'MOD1',
      title: 'Préparation documentaire',
      details: [
        'Vérification des registres de sécurité',
        'Contrôle des rapports de vérification technique',
        'Mise à jour des consignes et plans',
      ],
    },
    {
      id: 'MOD2',
      title: 'Audit de terrain',
      details: [
        "Visite à blanc de l'établissement",
        'Test des équipements de secours',
        'Simulation de passage de commission',
      ],
    },
  ],
  intra: [
    {
      id: 'MOD1',
      title: 'Analyse des besoins',
      details: [
        'Audit des risques spécifiques du site',
        'Définition des objectifs pédagogiques sur mesure',
      ],
    },
    {
      id: 'MOD2',
      title: 'Déploiement',
      details: [
        'Formation sur site des collaborateurs',
        'Exercices pratiques en environnement réel',
        "Débriefing et rapport d'intervention",
      ],
    },
  ],
};

const autresModulesEn = {
  commission: [
    {
      id: 'MOD1',
      title: 'Document preparation',
      details: [
        'Safety register review',
        'Technical inspection report verification',
        'Instructions and plans update',
      ],
    },
    {
      id: 'MOD2',
      title: 'Field audit',
      details: [
        'Mock facility inspection',
        'Rescue equipment testing',
        'Commission visit simulation',
      ],
    },
  ],
  intra: [
    {
      id: 'MOD1',
      title: 'Needs assessment',
      details: ['Site-specific risk audit', 'Definition of tailored learning objectives'],
    },
    {
      id: 'MOD2',
      title: 'Deployment',
      details: [
        'On-site staff training',
        'Practical drills in real environments',
        'Debriefing and intervention report',
      ],
    },
  ],
};

function makeAutresVariantFr(key: 'commission' | 'intra') {
  const isCommission = key === 'commission';
  return {
    stats1: {
      durationTotal: isCommission ? '1j' : '0.5-3j',
      durationBadge: 'Conseil',
      durationText: 'accompagnement',
      traineesTotal: '1-12',
      priceTotal: 'Sur devis',
      priceBadge: 'DEVIS',
      priceText: 'nous contacter',
      priceSuffix: '',
      successTotal: '100%',
      successBadge: 'Audit',
      successText: 'expertise SI.Groupe',
    },
    programStats: {
      standard: isCommission ? '1j' : 'Variable',
      adaptability: 'Sur mesure',
      ratio: '100%',
    },
    prerequisiteStats: {
      missionType: 'Audit',
      location: 'Sur site',
      compliance: '100%',
      method: 'Accomp.',
      missionTypeLabel: 'Type de mission',
      locationLabel: "Lieu d’intervention",
      complianceLabel: 'Conformité',
      methodLabel: 'Méthodologie',
      missionTypeBadge: 'Expert',
      locationBadge: 'Mobilité',
      complianceBadge: 'Réglementaire',
      methodBadge: 'Dédié',
      missionTypeText: 'conseil spécialisé',
      locationText: 'en entreprise',
      complianceText: 'sécurité ERP/IGH',
      methodText: 'suivi personnalisé',
    },
    modules: autresModulesFr[key],
    prerequisites: {
      rows: [
        {
          item: "Responsable d'établissement ou délégué",
          detail: 'Oui',
          importance: 'Requis',
        },
        {
          item: 'Accès aux locaux et documentation technique',
          detail: 'Oui',
          importance: 'Requis',
        },
      ],
    },
    presentation: {
      title: isCommission ? 'Commission de securite' : 'Formation intra-entreprise securite',
      intro: isCommission
        ? 'Préparation des établissements aux commissions de sécurité et suivi des exigences réglementaires.'
        : 'Parcours adaptés au site et au niveau de risque : accueil sécurité, évacuation, sensibilisation.',
      bullets: ['Expertise SI.Groupe', 'Accompagnement dédié'],
      badge: 'Conseil Expert',
    },
    loyalty: {
      title: 'Conseil',
      subtitle: 'Expertise',
      description: 'Accompagnement personnalisé pour la conformité de vos établissements.',
      audience: {
        title: 'Public',
        subtitle: 'Exploitants / Responsables',
        value: '',
      },
      certification: {
        title: 'Qualité',
        subtitle: '',
        badge: 'SI.Groupe',
        value: '',
      },
    },
    certification: {
      steps: [
        {
          title: 'Expertise & Conformité',
          description:
            'SI.Groupe met à votre disposition des experts en sécurité incendie pour garantir la conformité de vos établissements ERP/IGH vis-à-vis des commissions de sécurité et du Code du Travail.',
          badge: 'Certification',
        },
      ],
    },
    sessions: {
      title: 'Prestation sur mesure',
      subtitle:
        'Nos interventions de conseil et formations intra-entreprise sont planifiées selon vos disponibilités et contraintes.',
      badge: 'Contactez-nous pour un devis',
    },
  };
}

function makeAutresVariantEn(key: 'commission' | 'intra') {
  const isCommission = key === 'commission';
  return {
    stats1: {
      durationTotal: isCommission ? '1d' : '0.5-3d',
      durationBadge: 'Consulting',
      durationText: 'support',
      traineesTotal: '1-12',
      priceTotal: 'On quote',
      priceBadge: 'QUOTE',
      priceText: 'contact us',
      priceSuffix: '',
      successTotal: '100%',
      successBadge: 'Audit',
      successText: 'SI.Groupe expertise',
    },
    programStats: {
      standard: isCommission ? '1d' : 'Variable',
      adaptability: 'Tailored',
      ratio: '100%',
    },
    prerequisiteStats: {
      missionType: 'Audit',
      location: 'On-site',
      compliance: '100%',
      method: 'Support',
      missionTypeLabel: 'Mission type',
      locationLabel: 'Delivery location',
      complianceLabel: 'Compliance',
      methodLabel: 'Methodology',
      missionTypeBadge: 'Expert',
      locationBadge: 'Mobility',
      complianceBadge: 'Regulatory',
      methodBadge: 'Dedicated',
      missionTypeText: 'specialized consulting',
      locationText: 'within your company',
      complianceText: 'ERP/IGH safety',
      methodText: 'personalized follow-up',
    },
    modules: autresModulesEn[key],
    prerequisites: {
      rows: [
        {
          item: 'Facility manager or delegate',
          detail: 'Yes',
          importance: 'Required',
        },
        {
          item: 'Access to premises and technical documentation',
          detail: 'Yes',
          importance: 'Required',
        },
      ],
    },
    presentation: {
      title: isCommission ? 'Safety Commission Support' : 'In-house Safety Training',
      intro: isCommission
        ? 'Prepare facilities for safety commission reviews and regulatory follow-up.'
        : 'Site-tailored tracks according to risk level: safety induction, evacuation and awareness.',
      bullets: ['SI.Groupe expertise', 'Dedicated support'],
      badge: 'Expert consulting',
    },
    loyalty: {
      title: 'Consulting',
      subtitle: 'Expertise',
      description: 'Personalized support to ensure facility compliance.',
      audience: {
        title: 'Audience',
        subtitle: 'Operators / Managers',
        value: '',
      },
      certification: {
        title: 'Quality',
        subtitle: '',
        badge: 'SI.Groupe',
        value: '',
      },
    },
    certification: {
      steps: [
        {
          title: 'Expertise & Compliance',
          description:
            'SI.Groupe provides fire-safety experts to ensure your ERP/IGH facilities remain compliant with safety commissions and labour regulations.',
          badge: 'Certification',
        },
      ],
    },
    sessions: {
      title: 'Tailored service',
      subtitle:
        'Our consulting interventions and in-house safety courses are scheduled around your availability and constraints.',
      badge: 'Contact us for a quote',
    },
  };
}

export const sheetContentAutresMessages = {
  fr: {
    landing: {
      sheetContent: {
        autres: {
          commission: makeAutresVariantFr('commission'),
          intra: makeAutresVariantFr('intra'),
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        autres: {
          commission: makeAutresVariantEn('commission'),
          intra: makeAutresVariantEn('intra'),
        },
      },
    },
  },
};
