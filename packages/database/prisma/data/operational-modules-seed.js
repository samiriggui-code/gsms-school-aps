/** Seed support tickets, campagnes, redirections SEO, budget et paiements démo. */

async function seedOperationalModules(prisma) {
  const year = new Date().getFullYear();

  const campaigns = [
    {
      name: 'Catalogue formations — printemps',
      channel: 'landing',
      status: 'ACTIVE',
      utmSource: 'landing',
      utmMedium: 'organic',
      utmCampaign: 'catalogue-printemps',
    },
    {
      name: 'Devis entreprise B2B',
      channel: 'email',
      status: 'ACTIVE',
      utmSource: 'crm',
      utmMedium: 'email',
      utmCampaign: 'devis-b2b',
    },
  ];

  for (const c of campaigns) {
    const existing = await prisma.marketingCampaign.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.marketingCampaign.create({ data: c });
    }
  }

  const redirects = [
    { sourcePath: '/catalogue', targetPath: '/#catalogue', redirectType: 302, active: true },
    { sourcePath: '/preinscription', targetPath: '/#preinscription', redirectType: 302, active: true },
    { sourcePath: '/contact', targetPath: '/#contact', redirectType: 302, active: true },
    { sourcePath: '/devis', targetPath: '/#devis', redirectType: 301, active: true },
  ];

  for (const r of redirects) {
    await prisma.seoRedirect.upsert({
      where: { sourcePath: r.sourcePath },
      create: r,
      update: { targetPath: r.targetPath, redirectType: r.redirectType, active: r.active },
    });
  }

  const landingExisting = await prisma.landingConfig.findFirst();
  if (!landingExisting) {
    await prisma.landingConfig.create({
      data: {
        enabled: true,
        sections: [
          { type: 'hero', title: "Accueil FORM'SSI", enabled: true },
          { type: 'trusted-brands', title: 'Marques de confiance', enabled: true },
          { type: 'how-it-works', title: 'Comment ça marche', enabled: true },
          { type: 'features', title: 'Atouts', enabled: true },
          { type: 'trainers', title: 'Formateurs', enabled: true },
          { type: 'testimonials', title: 'Témoignages', enabled: true },
          { type: 'catalogue', title: 'Catalogue formations', enabled: true },
          { type: 'faq', title: 'FAQ', enabled: true },
          { type: 'call-to-action', title: 'Appel à action', enabled: true },
          { type: 'contact', title: 'Contact', enabled: true },
        ],
      },
    });
  }

  const budgetLines = [
    { label: 'Formations présentiel', category: 'FORMATION', periodYear: year, periodMonth: null, plannedAmount: 120000 },
    { label: 'Charges pédagogiques', category: 'RH', periodYear: year, periodMonth: null, plannedAmount: 85000 },
    { label: 'Matériel & consommables', category: 'EQUIPEMENT', periodYear: year, periodMonth: null, plannedAmount: 20000 },
  ];

  for (const line of budgetLines) {
    const existing = await prisma.financeBudgetLine.findFirst({
      where: { label: line.label, periodYear: line.periodYear },
    });
    if (!existing) {
      await prisma.financeBudgetLine.create({ data: line });
    }
  }

  const acceptedDevis = await prisma.financeDevis.findFirst({
    where: { status: 'ACCEPTED' },
    select: { id: true, referenceCode: true, totalTtc: true, currency: true },
  });

  if (acceptedDevis) {
    const payRef = `PAY-${acceptedDevis.referenceCode}`;
    const existingPay = await prisma.financePayment.findUnique({ where: { referenceCode: payRef } });
    if (!existingPay) {
      await prisma.financePayment.create({
        data: {
          referenceCode: payRef,
          devisId: acceptedDevis.id,
          amount: acceptedDevis.totalTtc,
          currency: acceptedDevis.currency,
          status: 'PENDING',
          method: 'Virement',
          notes: 'Paiement en attente — seed démo',
        },
      });
    }
  }

  const ticketRef = 'TKT-0001';
  const existingTicket = await prisma.supportTicket.findUnique({ where: { referenceCode: ticketRef } });
  let ticketId = existingTicket?.id;
  if (!existingTicket) {
    const created = await prisma.supportTicket.create({
      data: {
        referenceCode: ticketRef,
        subject: 'Question sur modalité de financement CPF',
        description: 'Un candidat souhaite confirmer l’éligibilité CPF pour la formation SSIAP 1.',
        status: 'OPEN',
        priority: 'MEDIUM',
        requesterName: 'Jean Dupont',
        requesterEmail: 'jean.dupont@example.com',
      },
    });
    ticketId = created.id;
  }

  const helpArticles = [
    {
      slug: 'prise-en-charge-ticket',
      title: 'Comment prendre en charge un ticket support',
      body: 'Ouvrez la file tickets, cliquez sur Prendre en charge ou assignez-vous dans la fiche. Répondez via l’onglet Conversation.',
      excerpt: 'Workflow de prise en charge des tickets CRM.',
      category: 'support',
      audience: 'STAFF',
      status: 'PUBLISHED',
      tags: ['ticket', 'support', 'workflow'],
    },
    {
      slug: 'declarer-incident-qualite',
      title: 'Déclarer un incident qualité',
      body: 'Créez un incident depuis Qualité > Incidents. Liez le ticket et l’équipement concernés pour la traçabilité.',
      excerpt: 'Procédure de déclaration incident matériel ou processus.',
      category: 'qualite',
      audience: 'STAFF',
      status: 'PUBLISHED',
      tags: ['incident', 'qualite'],
    },
    {
      slug: 'financement-cpf-faq',
      title: 'FAQ — Financement CPF',
      body: 'Le CPF est utilisable si la formation est éligible et le dossier candidat complet. Vérifier le NDA et Qualiopi.',
      excerpt: 'Réponses aux questions fréquentes sur le CPF.',
      category: 'finance',
      audience: 'PUBLIC',
      status: 'PUBLISHED',
      tags: ['cpf', 'finance'],
    },
  ];

  for (const article of helpArticles) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      create: {
        ...article,
        publishedAt: new Date(),
      },
      update: {
        title: article.title,
        body: article.body,
        excerpt: article.excerpt,
        category: article.category,
        status: article.status,
      },
    });
  }

  const equipment = await prisma.equipment.findFirst({
    where: { status: 'OUT_OF_SERVICE' },
    select: { id: true },
  });

  const incidents = [
    {
      referenceCode: 'INC-0001',
      title: 'Portique détecteur hors service',
      description: 'Le portique pédagogique ne s’allume plus — impact sur les sessions pratiques sécurité.',
      severity: 'HIGH',
      status: 'UNDER_ANALYSIS',
      category: 'Matériel',
      ticketId: ticketId ?? null,
      equipmentId: equipment?.id ?? null,
    },
    {
      referenceCode: 'INC-0002',
      title: 'Retard traitement tickets urgents',
      description: 'Backlog de tickets HIGH/URGENT non résolus sous 48h.',
      severity: 'MEDIUM',
      status: 'REPORTED',
      category: 'Processus',
      ticketId: ticketId ?? null,
    },
  ];

  for (const inc of incidents) {
    const existing = await prisma.qualityIncident.findUnique({
      where: { referenceCode: inc.referenceCode },
    });
    if (!existing) {
      await prisma.qualityIncident.create({ data: inc });
    }
  }

  const defaultLayouts = [
    { moduleKey: 'crm-dashboard', settingKey: 'layout', value: { widgets: ['kpis', 'highlights', 'welcome', 'menu-cards'] } },
    { moduleKey: 'formateur-dashboard', settingKey: 'layout', value: { widgets: ['sessions', 'learners', 'tasks'] } },
    { moduleKey: 'stagiaire-dashboard', settingKey: 'layout', value: { widgets: ['parcours', 'documents', 'planning'] } },
  ];

  for (const layout of defaultLayouts) {
    await prisma.moduleSetting.upsert({
      where: {
        moduleKey_settingKey: {
          moduleKey: layout.moduleKey,
          settingKey: layout.settingKey,
        },
      },
      create: layout,
      update: { value: layout.value },
    });
  }
}

module.exports = { seedOperationalModules };
