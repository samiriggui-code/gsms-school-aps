/**
 * Référentiel postes RH + demandes d'absence démo.
 */
async function seedRhAbsencesAndPositions(tx) {
  const positions = [
    { code: 'RESP_AGENCE', label: 'Responsable d’agence', sortOrder: 10 },
    { code: 'CHEF_EQUIPE', label: 'Chef d’équipe', sortOrder: 20 },
    { code: 'AGENT', label: 'Agent / collaborateur terrain', sortOrder: 30 },
    { code: 'FORMATEUR', label: 'Formateur', sortOrder: 40 },
    { code: 'ADMIN', label: 'Assistant administratif', sortOrder: 50 },
  ];

  for (const p of positions) {
    await tx.rhPosition.upsert({
      where: { code: p.code },
      create: p,
      update: { label: p.label, sortOrder: p.sortOrder },
    });
  }

  const collaborators = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      role: { slug: { in: ['collaborateur', 'formateur', 'admin'] } },
    },
    select: { id: true },
    take: 3,
  });

  if (collaborators.length === 0) {
    console.log('RH absences seed skipped: no collaborators.');
    return;
  }

  const existing = await tx.rhAbsence.count();
  if (existing > 0) {
    console.log('RH absences already seeded.');
    return;
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const samples = [
    {
      userId: collaborators[0].id,
      type: 'CONGE_PAYE',
      status: 'APPROVED',
      startDate: new Date(y, m, 10),
      endDate: new Date(y, m, 12),
      reason: 'Congés planifiés',
    },
    {
      userId: collaborators[1]?.id ?? collaborators[0].id,
      type: 'MALADIE',
      status: 'PENDING',
      startDate: new Date(y, m, 18),
      endDate: new Date(y, m, 19),
      reason: 'Arrêt maladie — justificatif à fournir',
    },
    {
      userId: collaborators[2]?.id ?? collaborators[0].id,
      type: 'RTT',
      status: 'REJECTED',
      startDate: new Date(y, m + 1, 3),
      endDate: new Date(y, m + 1, 3),
      reason: 'RTT — refus planning',
    },
  ];

  for (const s of samples) {
    await tx.rhAbsence.create({ data: s });
  }

  console.log('RH positions & absences seeded.');
}

module.exports = { seedRhAbsencesAndPositions };
