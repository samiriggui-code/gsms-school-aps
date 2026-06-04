/**
 * Leads landing (devis + préinscription) et devis Finance — données démo alignées formulaires vitrine.
 */
const LANDING_QUOTE_LEAD_SOURCE = 'Landing demande de devis';
const LANDING_PREINSCRIPTION_LEAD_SOURCE = 'Landing preinscription centralisee';

function money(n) {
  return Math.round(n * 100) / 100;
}

function totalsFromLines(lines) {
  let subtotalHt = 0;
  let vatTotal = 0;
  for (const row of lines) {
    const ht = Number(row.quantity) * Number(row.unitPriceHt);
    const vat = ht * (Number(row.vatRate) / 100);
    subtotalHt += ht;
    vatTotal += vat;
  }
  return {
    subtotalHt: money(subtotalHt),
    vatTotal: money(vatTotal),
    totalTtc: money(subtotalHt + vatTotal),
  };
}

function buildQuoteNotes({ slug, formationName, company, siret, trainees, dates, modality }) {
  return [
    '=== Formation demandée ===',
    `Slug CRM: ${slug}`,
    `Libellé: ${formationName}`,
    '',
    '=== Contact ===',
    'Marie Dupont',
    'Email: quote.demo@entreprise-seed.fr',
    'Téléphone: +33 6 12 34 56 78',
    'Fonction: Responsable RH',
    '',
    '=== Entreprise / structure ===',
    `Raison sociale: ${company}`,
    siret ? `SIRET / SIREN: ${siret}` : '',
    'Adresse / site d’intervention: Lyon (69003)',
    '',
    '=== Projet & planning ===',
    `Nombre de stagiaires (estimation): ${trainees}`,
    modality ? `Modalité souhaitée: ${modality}` : '',
    `Période ou dates souhaitées:\n${dates}`,
    'Financement envisagé: OPCO',
    '',
    '=== Précisions complémentaires ===',
    'Multi-sites possible ; préférence matin.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function seedLandingLeadsAndDevis(tx) {
  /** Préfère une fiche ACTIVE (catalogue seed). Sinon toute formation : évite liste / devis vides si statuts différents. */
  let formation = await tx.formation.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  if (!formation) {
    formation = await tx.formation.findFirst({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    if (formation) {
      console.warn(
        `[seed] landing-leads-devis: pas de formation ACTIVE — utilisation de « ${formation.name} » pour les leads / devis demo.`,
      );
    }
  }

  if (!formation) {
    console.warn(
      '[seed] landing-leads-devis: aucune formation en base — ignoré. Lancez le seed catalogue (`seedFormationsCatalog`) ou créez une Formation.',
    );
    return;
  }

  const seedEmails = [
    'quote.demo@entreprise-seed.fr',
    'quote2.demo@entreprise-seed.fr',
    'preinscription.demo@seed.fr',
  ];

  await tx.financeDevis.deleteMany({
    where: { referenceCode: { startsWith: 'DEV-SEED-' } },
  });
  await tx.lead.deleteMany({
    where: { email: { in: seedEmails } },
  });

  const lines1 = [
    { label: 'Prestation intra entreprise (3 j)', quantity: 1, unitPriceHt: 4200, vatRate: 20 },
    { label: 'Supports pédagogiques / stagiaire', quantity: 12, unitPriceHt: 45, vatRate: 20 },
  ];
  const t1 = totalsFromLines(lines1);

  const lines2 = [{ label: 'Audit réglementaire + proposition PMS', quantity: 1, unitPriceHt: 2800, vatRate: 20 }];
  const t2 = totalsFromLines(lines2);

  const lead1 = await tx.lead.create({
    data: {
      firstName: 'Marie',
      lastName: 'Dupont',
      email: seedEmails[0],
      phone: '+33 6 12 34 56 78',
      source: LANDING_QUOTE_LEAD_SOURCE,
      status: 'NEW',
      formationId: formation.id,
      notes: buildQuoteNotes({
        slug: formation.slug,
        formationName: formation.name,
        company: 'Acme Sécurité SAS',
        siret: '84938475839485',
        trainees: '12',
        dates: 'Juin — juillet 2026, hors vacances scolaires',
        modality: 'En intra sur site (vos locaux)',
      }),
    },
  });

  const lead2 = await tx.lead.create({
    data: {
      firstName: 'Karim',
      lastName: 'Benali',
      email: seedEmails[1],
      phone: '+33 7 98 76 54 32',
      source: LANDING_QUOTE_LEAD_SOURCE,
      status: 'CONTACTED',
      formationId: formation.id,
      notes: buildQuoteNotes({
        slug: formation.slug,
        formationName: formation.name,
        company: 'TechProtect Industries',
        siret: '73282938475612',
        trainees: '8',
        dates: 'Dès que possible — Q3 2026',
        modality: 'Mixte (théorie centre / pratique site)',
      })
        .replace('Marie Dupont', 'Karim Benali')
        .replace('quote.demo@entreprise-seed.fr', seedEmails[1]),
    },
  });

  await tx.lead.create({
    data: {
      firstName: 'Léa',
      lastName: 'Martin',
      email: seedEmails[2],
      phone: '+33 6 11 22 33 44',
      source: LANDING_PREINSCRIPTION_LEAD_SOURCE,
      status: 'NEW',
      notes: [
        'Canal: landing-preinscription',
        `Formation visée: ${formation.name}`,
        'Mode de financement souhaité: CPF',
        'Session visée: Session demo seed',
        'Date de naissance: 1998-04-12',
        'Lieu de naissance: Paris',
        'Nationalité: FR',
        'Adresse: 10 rue du Seed, 75001 Paris',
        'Situation actuelle: Salarié',
        'Motivation: reconversion cynophile',
      ].join('\n'),
    },
  });

  await tx.financeDevis.create({
    data: {
      referenceCode: 'DEV-SEED-001',
      title: `Devis ${formation.name} — Acme Sécurité`,
      status: 'DRAFT',
      leadId: lead1.id,
      formationId: formation.id,
      clientSnapshot: {
        company: 'Acme Sécurité SAS',
        companySiret: '84938475839485',
        companyAddress: 'Lyon (69003)',
        contactRole: 'Responsable RH',
        traineesExpected: '12',
        preferredDates: 'Juin — juillet 2026',
        deliveryMode: 'En intra sur site (vos locaux)',
        fundingHint: 'OPCO',
      },
      lines: lines1,
      subtotalHt: t1.subtotalHt,
      vatTotal: t1.vatTotal,
      totalTtc: t1.totalTtc,
      notes: 'Devis seed — à valider avec le client.',
      internalNotes: 'Priorité commerciale seed.',
      validUntil: new Date('2026-12-31'),
    },
  });

  await tx.financeDevis.create({
    data: {
      referenceCode: 'DEV-SEED-002',
      title: `Proposition ${formation.name} — TechProtect`,
      status: 'SENT',
      leadId: lead2.id,
      formationId: formation.id,
      clientSnapshot: {
        company: 'TechProtect Industries',
        companySiret: '73282938475612',
        traineesExpected: '8',
        preferredDates: 'Q3 2026',
        deliveryMode: 'Mixte',
      },
      lines: lines2,
      subtotalHt: t2.subtotalHt,
      vatTotal: t2.vatTotal,
      totalTtc: t2.totalTtc,
      notes: 'Envoyé au client (seed).',
      validUntil: new Date('2026-09-30'),
    },
  });

  console.log('[seed] Leads landing + devis Finance (DEV-SEED-*) créés.');
}

module.exports = { seedLandingLeadsAndDevis };
