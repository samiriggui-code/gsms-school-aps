/**
 * Directeur de l'école (Yassine HIDJEB) + équipe direction (ex-candidats promus).
 * Alimente Structure, organigramme RH, landing #trainers (volet direction).
 */

const { findUserByAppLogin, ensureDirectorAccount, DIRECTOR_LOGIN_EMAIL } = require('./user-email-fields');

const DIRECTION_ORG_UNIT_ID = 'seed-structure-direction';
const DIRECTION_TEAM_ID = 'seed-structure-team-direction';

const DIRECTION_PRESENTATIONS = [
  "Coordination stratégique des parcours et pilotage qualité — interface avec les financeurs et partenaires.",
  "Support à la direction sur la conformité réglementaire, le suivi des dossiers et l'organisation des sessions.",
];

async function seedDirectionTeam(tx) {
  const collabRole = await tx.userRole.findUnique({
    where: { slug: 'collaborateur' },
    select: { id: true },
  });

  const director = await ensureDirectorAccount(tx);
  if (!director?.id) {
    console.warn('[seed] direction-team : directeur introuvable — ignoré.');
    return null;
  }

  await tx.collaborateurProfile.upsert({
    where: { userId: director.id },
    create: { userId: director.id, schoolInternalService: 'DIRECTION' },
    update: { schoolInternalService: 'DIRECTION' },
  });

  if (collabRole?.id) {
    const promotable = await tx.user.findMany({
      where: {
        isTrashed: false,
        role: { slug: 'candidat' },
      },
      orderBy: { createdAt: 'asc' },
      take: 2,
      select: { id: true, name: true },
    });

    for (let i = 0; i < promotable.length; i += 1) {
      const u = promotable[i];
      await tx.user.update({
        where: { id: u.id },
        data: {
          roleId: collabRole.id,
          status: 'ACTIVE',
          jobFunction: 'Direction — coordination',
          landingPresentation: DIRECTION_PRESENTATIONS[i] ?? DIRECTION_PRESENTATIONS[0],
        },
      });
      await tx.collaborateurProfile.upsert({
        where: { userId: u.id },
        create: { userId: u.id, schoolInternalService: 'DIRECTION' },
        update: { schoolInternalService: 'DIRECTION' },
      });
    }
    if (promotable.length) {
      console.log(`[seed] Direction : ${promotable.length} candidat(s) promu(s) collaborateur direction.`);
    }
  }

  const samir = await findUserByAppLogin(tx, 'samir.iggui@ecole.local');
  if (samir) {
    await tx.collaborateurProfile.upsert({
      where: { userId: samir.id },
      create: { userId: samir.id, schoolInternalService: 'HR_ADMIN' },
      update: { schoolInternalService: 'HR_ADMIN' },
    });
  }

  await tx.rhOrgUnit.upsert({
    where: { id: DIRECTION_ORG_UNIT_ID },
    create: {
      id: DIRECTION_ORG_UNIT_ID,
      name: "Direction FORM'SSI",
      type: 'DIRECTION',
      managerId: director.id,
    },
    update: {
      name: "Direction FORM'SSI",
      type: 'DIRECTION',
      managerId: director.id,
    },
  });

  const directionMembers = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      collaborateurProfile: { schoolInternalService: 'DIRECTION' },
    },
    select: { id: true },
    orderBy: [{ createdAt: 'asc' }],
  });
  const memberIds = directionMembers.map((m) => m.id);

  await tx.rhTeam.upsert({
    where: { id: DIRECTION_TEAM_ID },
    create: {
      id: DIRECTION_TEAM_ID,
      name: "Direction de l'école",
      description: "Pilotage stratégique, gouvernance et équipe de direction FORM'SSI.",
      type: 'DIRECTION',
      sector: 'HEADQUARTERS',
      image: null,
      orgUnitId: DIRECTION_ORG_UNIT_ID,
      leaderId: director.id,
      lifecycleStatus: 'ACTIVE',
      formationSessionId: null,
    },
    update: {
      name: "Direction de l'école",
      description: "Pilotage stratégique, gouvernance et équipe de direction FORM'SSI.",
      type: 'DIRECTION',
      leaderId: director.id,
      orgUnitId: DIRECTION_ORG_UNIT_ID,
      image: null,
    },
  });

  for (const userId of memberIds) {
    await tx.rhTeamMember.upsert({
      where: { teamId_userId: { teamId: DIRECTION_TEAM_ID, userId } },
      create: { teamId: DIRECTION_TEAM_ID, userId },
      update: {},
    });
  }

  const stale = await tx.rhTeamMember.findMany({
    where: { teamId: DIRECTION_TEAM_ID, userId: { notIn: memberIds } },
    select: { id: true },
  });
  for (const row of stale) {
    await tx.rhTeamMember.delete({ where: { id: row.id } });
  }

  await tx.systemSetting.updateMany({
    where: { id: 'default-system-setting' },
    data: {
      directorFullName: 'Yassine HIDJEB',
      directorRole: "Directeur de l'école",
    },
  });

  console.log(
    `[seed] Direction : directeur ${DIRECTOR_LOGIN_EMAIL} + ${memberIds.length} membre(s) équipe direction.`,
  );

  return director.id;
}

module.exports = {
  seedDirectionTeam,
  DIRECTION_ORG_UNIT_ID,
  DIRECTION_TEAM_ID,
  DIRECTOR_LOGIN_EMAIL,
};
