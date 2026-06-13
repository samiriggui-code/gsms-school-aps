const ssiapProgramFr = {
  level1: [
    { id: 'UV1', title: 'Le feu et ses conséquences', details: ['Le feu', 'Comportement au feu'] },
    {
      id: 'UV2',
      title: 'Sécurité incendie',
      details: ['Principes de classement', 'Desserte des bâtiments', 'Cloisonnement', 'Évacuation'],
    },
    {
      id: 'UV3',
      title: 'Installations techniques',
      details: ['Installations électriques', 'Ascenseurs', 'Système de Sécurité Incendie (SSI)'],
    },
    {
      id: 'UV4',
      title: 'Rôle et missions des agents',
      details: ['Le service de sécurité', 'Le poste de contrôle', 'Rondes de sécurité', 'Appel des secours'],
    },
    {
      id: 'UV5',
      title: 'Concrétisation des acquis',
      details: ['Visite applicative', "Mises en situation d'urgence"],
    },
  ],
  level2: [
    {
      id: 'UV1',
      title: 'Gestion du personnel',
      details: ["Management de l'équipe de sécurité", 'Organisation du service'],
    },
    {
      id: 'UV2',
      title: 'Sécurité incendie et réglementation',
      details: ['Règlements de sécurité ERP/IGH', 'Dossier technique'],
    },
    {
      id: 'UV3',
      title: 'Gestion du PC et des alertes',
      details: ['Gestion des alarmes', "Alerte des secours", "Coordination de l'intervention"],
    },
    {
      id: 'UV4',
      title: 'Conseil technique',
      details: ['Compte-rendu à la hiérarchie', 'Note de service'],
    },
  ],
  level3: [
    { id: 'UV1', title: 'Le feu et ses conséquences', details: ['Éclosion et propagation', 'Sinistralité'] },
    {
      id: 'UV2',
      title: 'La sécurité incendie et les bâtiments',
      details: ['Accessibilité', 'Matériaux de construction'],
    },
    {
      id: 'UV3',
      title: 'La réglementation',
      details: ['Évolution réglementaire', 'Commissions de sécurité'],
    },
    { id: 'UV4', title: 'Gestion des risques', details: ['Analyse de sinistres', 'Dossier technique'] },
    { id: 'UV5', title: 'Conseil technique', details: ['Management de projets', 'Budgets'] },
  ],
};

const ssiapProgramEn = {
  level1: [
    { id: 'UV1', title: 'Fire behavior and consequences', details: ['Fire fundamentals', 'Fire behavior'] },
    {
      id: 'UV2',
      title: 'Fire safety',
      details: ['Classification principles', 'Building access', 'Compartmentalization', 'Evacuation'],
    },
    {
      id: 'UV3',
      title: 'Technical systems',
      details: ['Electrical installations', 'Elevators', 'Fire Safety System (SSI)'],
    },
    {
      id: 'UV4',
      title: 'Agent roles and missions',
      details: ['Security department', 'Control room', 'Security rounds', 'Emergency call procedures'],
    },
    { id: 'UV5', title: 'Applied consolidation', details: ['Practical site visit', 'Emergency scenarios'] },
  ],
  level2: [
    {
      id: 'UV1',
      title: 'Staff management',
      details: ['Managing the security team', 'Service organization'],
    },
    {
      id: 'UV2',
      title: 'Fire safety and regulations',
      details: ['ERP/IGH fire safety regulations', 'Technical file'],
    },
    {
      id: 'UV3',
      title: 'Control room and alerts management',
      details: ['Alarm management', 'Emergency alert process', 'Intervention coordination'],
    },
    {
      id: 'UV4',
      title: 'Technical advisory',
      details: ['Reporting to management', 'Service memo drafting'],
    },
  ],
  level3: [
    { id: 'UV1', title: 'Fire behavior and consequences', details: ['Ignition and spread', 'Incident patterns'] },
    {
      id: 'UV2',
      title: 'Fire safety and buildings',
      details: ['Accessibility', 'Construction materials'],
    },
    {
      id: 'UV3',
      title: 'Regulatory framework',
      details: ['Regulatory updates', 'Safety commissions'],
    },
    { id: 'UV4', title: 'Risk management', details: ['Incident analysis', 'Technical file'] },
    { id: 'UV5', title: 'Technical advisory', details: ['Project management', 'Budgeting'] },
  ],
};

function makeSsiapVariantFr(level: 1 | 2 | 3, type: 'initial' | 'recyclage' | 'ran') {
  const stats = {
    1: {
      initial: { duration: '67h', days: '10j', price: '990' },
      recyclage: { duration: '14h', days: '2j', price: '450' },
      ran: { duration: '21h', days: '3j', price: '590' },
    },
    2: {
      initial: { duration: '70h', days: '10j', price: '1290' },
      recyclage: { duration: '14h', days: '2j', price: '550' },
      ran: { duration: '21h', days: '3j', price: '690' },
    },
    3: {
      initial: { duration: '216h', days: '30j', price: '2890' },
      recyclage: { duration: '21h', days: '3j', price: '750' },
      ran: { duration: '35h', days: '5j', price: '990' },
    },
  } as const;

  const programStats =
    level === 1
      ? { standard: '10j', total: '67h', theory: '80%', practice: '20%' }
      : level === 2
        ? { standard: '10j', total: '70h', theory: '80%', practice: '20%' }
        : { standard: '30j', total: '216h', theory: '80%', practice: '20%' };

  return {
    typeLabel: type === 'initial' ? 'Initiale' : type === 'recyclage' ? 'Recyclage / MAC' : 'Remise à niveau',
    stats1: {
      durationTotal: stats[level][type].duration,
      durationBadge: stats[level][type].days,
      durationText: type === 'initial' ? 'formation complète' : 'maintien / RAN',
      traineesTotal: '4-12',
      priceTotal: stats[level][type].price,
      priceBadge: 'EUR',
      priceText: 'à partir de',
      priceSuffix: '€',
      successTotal: '98%',
      successBadge: '99%',
    },
    programStats,
    prerequisiteStats: {
      cpf: 'OUI',
      funding: '100%',
      recycle: 'SST',
      validity: '3 ans',
      recycleLabel: 'Recyclage inclus',
      validityLabel: 'Validité Titre',
    },
    modules: ssiapProgramFr[`level${level}` as 'level1' | 'level2' | 'level3'],
    prerequisites: {
      rows: [
        { item: 'Aptitude Médicale', detail: 'Certificat médical de moins de 3 mois', importance: 'Obligatoire' },
        { item: 'Secourisme', detail: 'SST ou PSC1 en cours de validité', importance: 'Indispensable' },
        { item: 'Diplôme', detail: 'Diplôme SSIAP correspondant (pour MAC/RAN)', importance: 'Requis' },
        { item: 'Français', detail: 'Savoir lire, écrire et compter en français', importance: 'Requis' },
      ],
    },
    presentation: {
      title: `SSIAP ${level} - ${type.toUpperCase()}`,
      intro:
        type === 'initial'
          ? "Formation complète pour acquérir les compétences nécessaires à l'exercice de la fonction."
          : type === 'recyclage'
            ? 'Maintien et actualisation des compétences (MAC) obligatoire tous les 3 ans.'
            : 'Remise à niveau pour les personnels dont le triennat est dépassé.',
      suffix:
        "Cette formation est conforme à l'arrêté du 2 mai 2005 relatif aux missions, à l'emploi et à la qualification du personnel de sécurité incendie.",
      bullets: [
        'Prévention des incendies en ERP/IGH',
        'Sensibilisation des occupants',
        'Entretien élémentaire des moyens de secours',
        'Alerte et accueil des secours',
      ],
      badge: 'Certifié Qualiopi',
    },
    loyalty: {
      title: `SSIAP ${level}`,
      subtitle: type,
      description:
        type === 'initial'
          ? 'Formation certifiante pour accéder au métier de la sécurité incendie.'
          : "Session de maintien des acquis pour garantir l'expertise opérationnelle.",
      audience: {
        title: 'Public concerné',
        subtitle: 'Bénéficiaires',
        value: level === 3 ? 'Responsables sécurité' : level === 2 ? "Chefs d'équipe" : 'Agents de sécurité',
      },
      prerequisites: {
        title: 'Prérequis',
        subtitle: "Conditions d'accès",
        value: type === 'initial' ? 'Aptitude Médicale' : 'Diplôme SSIAP + SST',
      },
      certification: {
        title: 'Certification',
        subtitle: 'Type de titre',
        badge: 'Ministère',
        value: 'Intérieur',
      },
    },
    certification: {
      steps: [
        {
          title: 'Épreuves Théoriques',
          description: 'QCM de 30 à 40 questions sur la réglementation et les techniques incendie.',
          badge: 'Examen',
        },
        {
          title: 'Épreuves Pratiques',
          description: "Rondes de sécurité avec anomalies et gestion d'un PC sécurité en situation réelle.",
          badge: 'Mise en situation',
        },
        {
          title: "Diplôme d'État",
          description: "Délivrance du diplôme SSIAP reconnu par le Ministère de l'Intérieur.",
          badge: 'Certification',
        },
      ],
    },
    sessions: {
      subtitle: `SSIAP ${level} (${type})`,
      emptyHint: 'Créez une session dans le CRM avec une formation au même slug pour l’afficher ici.',
    },
  };
}

function makeSsiapVariantEn(level: 1 | 2 | 3, type: 'initial' | 'recyclage' | 'ran') {
  const stats = {
    1: {
      initial: { duration: '67h', days: '10d', price: '990' },
      recyclage: { duration: '14h', days: '2d', price: '450' },
      ran: { duration: '21h', days: '3d', price: '590' },
    },
    2: {
      initial: { duration: '70h', days: '10d', price: '1290' },
      recyclage: { duration: '14h', days: '2d', price: '550' },
      ran: { duration: '21h', days: '3d', price: '690' },
    },
    3: {
      initial: { duration: '216h', days: '30d', price: '2890' },
      recyclage: { duration: '21h', days: '3d', price: '750' },
      ran: { duration: '35h', days: '5d', price: '990' },
    },
  } as const;

  const programStats =
    level === 1
      ? { standard: '10d', total: '67h', theory: '80%', practice: '20%' }
      : level === 2
        ? { standard: '10d', total: '70h', theory: '80%', practice: '20%' }
        : { standard: '30d', total: '216h', theory: '80%', practice: '20%' };

  return {
    typeLabel: type === 'initial' ? 'Initial' : type === 'recyclage' ? 'Refresher / MAC' : 'Skills update',
    stats1: {
      durationTotal: stats[level][type].duration,
      durationBadge: stats[level][type].days,
      durationText: type === 'initial' ? 'full course' : 'maintenance / refresher',
      traineesTotal: '4-12',
      priceTotal: stats[level][type].price,
      priceBadge: 'EUR',
      priceText: 'from',
      priceSuffix: '€',
      successTotal: '98%',
      successBadge: '99%',
    },
    programStats,
    prerequisiteStats: {
      cpf: 'YES',
      funding: '100%',
      recycle: 'SST',
      validity: '3 years',
      recycleLabel: 'Refresher included',
      validityLabel: 'Certificate validity',
    },
    modules: ssiapProgramEn[`level${level}` as 'level1' | 'level2' | 'level3'],
    prerequisites: {
      rows: [
        {
          item: 'Medical fitness',
          detail: 'Medical certificate issued within the last 3 months',
          importance: 'Mandatory',
        },
        { item: 'First aid', detail: 'Valid SST or PSC1 certificate', importance: 'Essential' },
        {
          item: 'Diploma',
          detail: 'Matching SSIAP diploma (for MAC/refresher tracks)',
          importance: 'Required',
        },
        { item: 'French', detail: 'Ability to read, write and count in French', importance: 'Required' },
      ],
    },
    presentation: {
      title: `SSIAP ${level} - ${type.toUpperCase()}`,
      intro:
        type === 'initial'
          ? 'Comprehensive track to acquire all competencies required for the role.'
          : type === 'recyclage'
            ? 'Mandatory skills maintenance and update every 3 years.'
            : 'Skills update course for personnel whose 3-year cycle has expired.',
      suffix:
        'This training complies with the French decree of 2 May 2005 governing missions, roles and qualifications of fire safety staff.',
      bullets: [
        'Fire prevention in ERP/IGH facilities',
        'Occupant safety awareness',
        'Basic maintenance of rescue equipment',
        'Alert handling and emergency services reception',
      ],
      badge: 'Qualiopi certified',
    },
    loyalty: {
      title: `SSIAP ${level}`,
      subtitle: type,
      description:
        type === 'initial'
          ? 'Certifying course to start a professional fire safety career.'
          : 'Skills maintenance session to preserve operational excellence.',
      audience: {
        title: 'Target audience',
        subtitle: 'Learners',
        value: level === 3 ? 'Safety managers' : level === 2 ? 'Team leaders' : 'Security officers',
      },
      prerequisites: {
        title: 'Prerequisites',
        subtitle: 'Entry requirements',
        value: type === 'initial' ? 'Medical fitness' : 'SSIAP diploma + SST',
      },
      certification: {
        title: 'Certification',
        subtitle: 'Credential type',
        badge: 'Ministry',
        value: 'Interior',
      },
    },
    certification: {
      steps: [
        {
          title: 'Theory assessments',
          description: '30 to 40 MCQ questions on regulations and fire-safety techniques.',
          badge: 'Exam',
        },
        {
          title: 'Practical assessments',
          description: 'Security rounds with anomalies and control-room management in realistic scenarios.',
          badge: 'Scenario',
        },
        {
          title: 'State diploma',
          description: 'Issuance of the SSIAP diploma recognized by the Ministry of Interior.',
          badge: 'Certification',
        },
      ],
    },
    sessions: {
      subtitle: `SSIAP ${level} (${type})`,
      emptyHint: 'Create a session in the CRM with the same formation slug to display it here.',
    },
  };
}

export const sheetContentSsiapMessages = {
  fr: {
    landing: {
      sheetContent: {
        ssiap: {
          level1: {
            initial: makeSsiapVariantFr(1, 'initial'),
            recyclage: makeSsiapVariantFr(1, 'recyclage'),
            ran: makeSsiapVariantFr(1, 'ran'),
          },
          level2: {
            initial: makeSsiapVariantFr(2, 'initial'),
            recyclage: makeSsiapVariantFr(2, 'recyclage'),
            ran: makeSsiapVariantFr(2, 'ran'),
          },
          level3: {
            initial: makeSsiapVariantFr(3, 'initial'),
            recyclage: makeSsiapVariantFr(3, 'recyclage'),
            ran: makeSsiapVariantFr(3, 'ran'),
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        ssiap: {
          level1: {
            initial: makeSsiapVariantEn(1, 'initial'),
            recyclage: makeSsiapVariantEn(1, 'recyclage'),
            ran: makeSsiapVariantEn(1, 'ran'),
          },
          level2: {
            initial: makeSsiapVariantEn(2, 'initial'),
            recyclage: makeSsiapVariantEn(2, 'recyclage'),
            ran: makeSsiapVariantEn(2, 'ran'),
          },
          level3: {
            initial: makeSsiapVariantEn(3, 'initial'),
            recyclage: makeSsiapVariantEn(3, 'recyclage'),
            ran: makeSsiapVariantEn(3, 'ran'),
          },
        },
      },
    },
  },
};
