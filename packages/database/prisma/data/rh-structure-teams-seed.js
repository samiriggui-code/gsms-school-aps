/**
 * Équipes RH permanentes alignées sur Compagnie → Structure (annuaire 3 onglets).
 * - Pool formateurs (rôle formateur)
 * - Équipe pédagogique (rôle collaborateur)
 * - Équipe RH & administration (admin / superadmin)
 */

function splitFullName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function hydrateStaffUserDisplay(tx) {
  const avatarPool = [
    '/uploads/crm/collaborateur/7fb47851-008f-44a4-9eed-301bb8ed3553/avatar/1781390225224-hd5za7yw.png',
    '/uploads/crm/collaborateur/f51130ba-32ba-48e6-aba7-f43bf58508d9/avatar/1781390463820-zq5m6um2.png',
    '/uploads/crm/collaborateur/1b0486b9-50cb-4820-8929-507fc6699681/avatar/1781390448477-gbi4z8g9.png',
    '/uploads/company/avatars/1781389770744-xiymfnfs.png',
  ];

  const staff = await tx.user.findMany({
    where: {
      isTrashed: false,
      role: { slug: { in: ['formateur', 'collaborateur', 'admin', 'superadmin'] } },
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      avatar: true,
      email: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  let index = 0;
  for (const user of staff) {
    const { firstName, lastName } = splitFullName(user.name || user.email);
    const avatar =
      user.avatar || avatarPool[index % avatarPool.length];
    index += 1;
    await tx.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName || firstName,
        lastName: user.lastName || lastName,
        avatar,
      },
    });
  }
}

const STRUCTURE_TEAM_DEFS = [
  {
    teamId: 'seed-structure-team-formateurs',
    orgUnitId: 'seed-structure-pole-formateurs',
    orgUnitName: 'Pôle formateurs',
    orgUnitType: 'POLE',
    teamName: 'Pool formateurs',
    teamImage: '/screens/hero/securite-privee.jpg',
    teamDescription:
      "Équipe permanente du pool formateurs — même composition que l'onglet Formateurs (Structure).",
    teamType: 'TRAINER_POOL',
    profileService: 'TRAINER_POOL',
    roleSlugs: ['formateur'],
    profileKind: 'formateur',
  },
  {
    teamId: 'seed-structure-team-pedagogique',
    orgUnitId: 'seed-structure-pole-pedagogique',
    orgUnitName: 'Pôle pédagogique',
    orgUnitType: 'POLE',
    teamName: 'Équipe pédagogique',
    teamImage: '/screens/hero/sst-formation.jpg',
    teamDescription:
      "Équipe permanente pédagogie & conformité — même composition que l'onglet Équipe pédagogique (Structure).",
    teamType: 'PEDAGOGICAL',
    profileService: 'PEDAGOGICAL',
    roleSlugs: ['collaborateur'],
    profileKind: 'collaborateur',
  },
  {
    teamId: 'seed-structure-team-rh-admin',
    orgUnitId: 'seed-structure-pole-rh-admin',
    orgUnitName: 'Pôle RH & administration',
    orgUnitType: 'SERVICE',
    teamName: 'Équipe RH & administration',
    teamImage: '/images/compte-formation.jpg',
    teamDescription:
      "Équipe permanente RH et administration — même composition que l'onglet Équipe RH & admin (Structure).",
    teamType: 'HR_ADMIN',
    profileService: 'HR_ADMIN',
    roleSlugs: ['admin', 'superadmin'],
    profileKind: 'collaborateur',
  },
];

const DIRECTION_ORG_UNIT_ID = 'seed-structure-direction';

async function fetchActiveUsersByRoles(tx, roleSlugs) {
  return tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      role: { slug: { in: roleSlugs } },
    },
    select: { id: true, email: true, createdAt: true },
    orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
  });
}

async function ensureProfileService(tx, users, profileKind, service) {
  for (const user of users) {
    if (profileKind === 'formateur') {
      await tx.formateurProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          isInternal: true,
          schoolInternalService: service,
        },
        update: { schoolInternalService: service },
      });
      continue;
    }

    await tx.collaborateurProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        schoolInternalService: service,
      },
      update: { schoolInternalService: service },
    });
  }
}

async function syncTeamMembers(tx, teamId, memberIds, leaderId) {
  const keep = new Set(memberIds);

  for (const userId of memberIds) {
    await tx.rhTeamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }

  const stale = await tx.rhTeamMember.findMany({
    where: {
      teamId,
      userId: { notIn: [...keep] },
    },
    select: { id: true },
  });

  for (const row of stale) {
    await tx.rhTeamMember.delete({ where: { id: row.id } });
  }

  await tx.rhTeam.update({
    where: { id: teamId },
    data: { leaderId: leaderId ?? null },
  });
}

async function seedRhStructureTeams(tx) {
  await hydrateStaffUserDisplay(tx);

  await tx.rhOrgUnit.upsert({
    where: { id: DIRECTION_ORG_UNIT_ID },
    create: {
      id: DIRECTION_ORG_UNIT_ID,
      name: "Direction FORM'SSI",
      type: 'DIRECTION',
    },
    update: {
      name: "Direction FORM'SSI",
      type: 'DIRECTION',
    },
  });

  let totalMembers = 0;

  for (const def of STRUCTURE_TEAM_DEFS) {
    const members = await fetchActiveUsersByRoles(tx, def.roleSlugs);
    await ensureProfileService(tx, members, def.profileKind, def.profileService);

    const leaderId = members[0]?.id ?? null;

    await tx.rhOrgUnit.upsert({
      where: { id: def.orgUnitId },
      create: {
        id: def.orgUnitId,
        name: def.orgUnitName,
        type: def.orgUnitType,
        parentId: DIRECTION_ORG_UNIT_ID,
        managerId: leaderId,
      },
      update: {
        name: def.orgUnitName,
        type: def.orgUnitType,
        parentId: DIRECTION_ORG_UNIT_ID,
        managerId: leaderId,
      },
    });

    await tx.rhTeam.upsert({
      where: { id: def.teamId },
      create: {
        id: def.teamId,
        name: def.teamName,
        description: def.teamDescription,
        type: def.teamType,
        sector: 'HEADQUARTERS',
        image: def.teamImage,
        orgUnitId: def.orgUnitId,
        leaderId,
        lifecycleStatus: 'ACTIVE',
        formationSessionId: null,
      },
      update: {
        name: def.teamName,
        description: def.teamDescription,
        type: def.teamType,
        sector: 'HEADQUARTERS',
        image: def.teamImage,
        orgUnitId: def.orgUnitId,
        leaderId,
      },
    });

    const memberIds = members.map((m) => m.id);
    await syncTeamMembers(tx, def.teamId, memberIds, leaderId);
    totalMembers += memberIds.length;

    console.log(
      `[seed] Équipe structure « ${def.teamName} » : ${memberIds.length} membre(s).`,
    );
  }

  console.log(
    `Équipes Structure seedées (3 pôles permanents, ${totalMembers} affectations membres).`,
  );
}

module.exports = { seedRhStructureTeams };
