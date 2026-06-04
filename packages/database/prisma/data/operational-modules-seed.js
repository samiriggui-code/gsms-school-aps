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
    { label: 'Matériel & consommables', category: 'EQUIPEMENT', periodYear: year, periodMonth: null, plannedAmount: 15000 },
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
  if (!existingTicket) {
    await prisma.supportTicket.create({
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
  }
}

module.exports = { seedOperationalModules };
