/**
 * Référentiel postes RH école + demandes d'absence démo.
 */
async function seedRhAbsencesAndPositions(tx) {
  const positions = [
    { code: 'FORMATEUR', label: 'Formateur', sortOrder: 10 },
    { code: 'DIRECTION_PEDAGOGIE', label: 'Direction & pédagogie', sortOrder: 20 },
    { code: 'SECRETARIAT', label: 'Secrétariat & accueil', sortOrder: 30 },
    { code: 'ADMIN_GENERALE', label: 'Administration générale', sortOrder: 40 },
    { code: 'COMPTABILITE', label: 'Comptabilité & finance', sortOrder: 50 },
    { code: 'RH', label: 'Ressources humaines', sortOrder: 60 },
    { code: 'MARKETING', label: 'Marketing & communication', sortOrder: 70 },
    { code: 'IT', label: 'IT & systèmes d\'information', sortOrder: 80 },
    { code: 'MAINTENANCE', label: 'Maintenance & logistique', sortOrder: 90 },
    { code: 'QUALITE', label: 'Qualité & conformité', sortOrder: 100 },
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

  console.log('RH positions (école) & absences seeded.');
}

module.exports = { seedRhAbsencesAndPositions };
