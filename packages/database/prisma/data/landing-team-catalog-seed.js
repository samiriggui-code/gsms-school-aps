/** Publie sur le landing (#trainers) les membres des équipes RH permanentes (ACTIVE). */
const VOLET_BY_TEAM_TYPE = {
  DIRECTION: 'direction',
  TRAINER_POOL: 'formateur',
  PEDAGOGICAL: 'pedagogique',
  HR_ADMIN: 'rh',
};

async function seedLandingTeamCatalog(tx) {
  const teams = await tx.rhTeam.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      formationSessionId: null,
      type: { in: ['DIRECTION', 'TRAINER_POOL', 'PEDAGOGICAL', 'HR_ADMIN'] },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, isTrashed: true, status: true } },
        },
      },
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  const typeOrder = { DIRECTION: 0, TRAINER_POOL: 1, PEDAGOGICAL: 2, HR_ADMIN: 3 };
  teams.sort((a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9));

  let sortOrder = 0;
  const syncedUserIds = new Set();

  for (const team of teams) {
    const volet = VOLET_BY_TEAM_TYPE[team.type];
    if (!volet) continue;
    for (const member of team.members) {
      const u = member.user;
      if (!u || u.isTrashed || u.status !== 'ACTIVE') continue;
      syncedUserIds.add(u.id);
      await tx.landingTeamOffer.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          volet,
          catalogStatus: 'ACTIVE',
          sortOrder,
        },
        update: {
          volet,
          catalogStatus: 'ACTIVE',
          sortOrder,
        },
      });
      sortOrder += 1;
    }
  }

  if (syncedUserIds.size > 0) {
    await tx.landingTeamOffer.updateMany({
      where: {
        catalogStatus: 'ACTIVE',
        userId: { notIn: [...syncedUserIds] },
      },
      data: { catalogStatus: 'ARCHIVED' },
    });
  }

  console.log(`[seed] Catalogue équipe landing : ${sortOrder} membre(s) publié(s).`);
  return sortOrder;
}

module.exports = { seedLandingTeamCatalog, VOLET_BY_TEAM_TYPE };
