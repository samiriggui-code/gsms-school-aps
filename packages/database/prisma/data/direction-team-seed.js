/**
 * Directeur (Yassine HIDJEB) + 2 adjoints direction (Lucas MERCIER, Inès MARTIN).
 * Daniel JACKSON → pédagogie · Sophia THOMAS → RH (hors équipe direction).
 */
const {
  findUserByAppLogin,
  ensureDirectorAccount,
  slugFromUser,
  toAppLoginEmail,
  toPersonalEmail,
  isAppLoginEmail,
  DIRECTOR_LOGIN_EMAIL,
} = require('./user-email-fields');

const DIRECTION_ORG_UNIT_ID = 'seed-structure-direction';
const DIRECTION_TEAM_ID = 'seed-structure-team-direction';

const DIRECTION_PRESENTATIONS = [
  'Coordination stratégique des parcours et pilotage qualité — interface avec les financeurs et partenaires.',
  "Support à la direction sur la conformité réglementaire, le suivi des dossiers et l'organisation des sessions.",
];

/** Comptes promus en direction (3 au total avec le directeur). */
const DIRECTION_STAFF = [
  {
    loginEmails: ['lucas.mercier@ecole.local', 'candidat.dev.1@ecole.local'],
    firstName: 'Lucas',
    lastName: 'MERCIER',
    jobFunction: 'Directeur adjoint',
    positionCode: 'DIR_ADJ',
    presentation: DIRECTION_PRESENTATIONS[0],
  },
  {
    loginEmails: ['ines.martin@ecole.local', 'candidat.dev.2@ecole.local'],
    firstName: 'Inès',
    lastName: 'MARTIN',
    jobFunction: 'Responsable administratif et financier (RAF)',
    positionCode: 'DIR_RAF',
    presentation: DIRECTION_PRESENTATIONS[1],
  },
];

/** Collaborateurs Metronic réaffectés hors direction. */
const POLE_STAFF_REASSIGNMENTS = [
  {
    loginEmail: 'daniel.jackson@ecole.local',
    firstName: 'Daniel',
    lastName: 'JACKSON',
    service: 'PEDAGOGICAL',
    jobFunction: 'Coordinateur pédagogique',
    positionCode: 'PED_COORD',
    qualification:
      'Conception de parcours & programmes · Suivi pédagogique des apprenants',
    presentation:
      'Coordination des parcours, animation des promotions et lien formateurs — apprenants.',
  },
  {
    loginEmail: 'sophia.thomas@ecole.local',
    firstName: 'Sophia',
    lastName: 'THOMAS',
    service: 'HR_ADMIN',
    jobFunction: 'Administration générale',
    positionCode: 'ADM_GENERAL',
    qualification: 'Administration scolaire & dossiers · Accueil & standard téléphonique',
    presentation:
      "Administration générale de l'établissement : dossiers, planning et support aux équipes.",
  },
];

async function applyStaffEmails(tx, userId, identity, seed = 0) {
  const slug = slugFromUser({
    firstName: identity.firstName,
    lastName: identity.lastName,
    name: `${identity.firstName} ${identity.lastName}`.trim(),
  });
  const existing = await tx.user.findUnique({
    where: { id: userId },
    select: { email: true, proEmail: true },
  });
  const personal =
    existing?.email?.trim() && !isAppLoginEmail(existing.email)
      ? existing.email.trim()
      : toPersonalEmail(slug, seed);
  const proEmail = toAppLoginEmail(slug);
  await tx.user.update({
    where: { id: userId },
    data: { email: personal, proEmail },
  });
}

async function seedDirectionTeam(tx, siteByCode) {
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

  const directionMemberIds = [director.id];

  if (collabRole?.id) {
    for (let i = 0; i < DIRECTION_STAFF.length; i += 1) {
      const spec = DIRECTION_STAFF[i];
      let u = null;
      for (const login of spec.loginEmails) {
        u = await findUserByAppLogin(tx, login);
        if (u) break;
      }
      if (!u) {
        console.warn(`[seed] direction-team : ${spec.loginEmails.join(' | ')} introuvable.`);
        continue;
      }
      const fullName = `${spec.firstName} ${spec.lastName}`.trim();
      await tx.user.update({
        where: { id: u.id },
        data: {
          roleId: collabRole.id,
          status: 'ACTIVE',
          firstName: spec.firstName,
          lastName: spec.lastName,
          name: fullName,
          jobFunction: spec.jobFunction,
          landingPresentation: spec.presentation,
          userCategory: 'INTERNAL',
        },
      });
      await applyStaffEmails(tx, u.id, spec, i + 1);
      await tx.collaborateurProfile.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          schoolInternalService: 'DIRECTION',
          managerUserId: director.id,
          jobFunction: spec.jobFunction,
        },
        update: {
          schoolInternalService: 'DIRECTION',
          managerUserId: director.id,
          jobFunction: spec.jobFunction,
        },
      });
      directionMemberIds.push(u.id);
      console.log(`[seed] Direction : ${fullName} → pôle DIRECTION (${spec.loginEmails[0]}).`);
    }

    for (const spec of POLE_STAFF_REASSIGNMENTS) {
      const u = await findUserByAppLogin(tx, spec.loginEmail);
      if (!u) {
        console.warn(`[seed] direction-team : ${spec.loginEmail} introuvable (réaffectation pôle).`);
        continue;
      }
      const fullName = `${spec.firstName} ${spec.lastName}`.trim();
      await tx.user.update({
        where: { id: u.id },
        data: {
          roleId: collabRole.id,
          status: 'ACTIVE',
          firstName: spec.firstName,
          lastName: spec.lastName,
          name: fullName,
          jobFunction: spec.jobFunction,
          qualification: spec.qualification,
          landingPresentation: spec.presentation,
          userCategory: 'INTERNAL',
        },
      });
      await applyStaffEmails(tx, u.id, spec, 10);
      await tx.collaborateurProfile.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          schoolInternalService: spec.service,
          jobFunction: spec.jobFunction,
          qualification: spec.qualification,
        },
        update: {
          schoolInternalService: spec.service,
          jobFunction: spec.jobFunction,
          qualification: spec.qualification,
        },
      });
      await tx.rhTeamMember.deleteMany({
        where: { userId: u.id, teamId: DIRECTION_TEAM_ID },
      });
      console.log(`[seed] ${fullName} → pôle ${spec.service} (hors direction).`);
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

  const campusSiteId = siteByCode?.get('CAMPUS-REUIL') ?? null;
  const teamSiteFields = campusSiteId
    ? { siteId: campusSiteId, sector: 'CAMPUS' }
    : { siteId: null, sector: 'HEADQUARTERS' };

  await tx.rhTeam.upsert({
    where: { id: DIRECTION_TEAM_ID },
    create: {
      id: DIRECTION_TEAM_ID,
      name: "Direction de l'école",
      description: "Pilotage stratégique, gouvernance et équipe de direction FORM'SSI.",
      type: 'DIRECTION',
      sector: teamSiteFields.sector,
      siteId: teamSiteFields.siteId,
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
      sector: teamSiteFields.sector,
      siteId: teamSiteFields.siteId,
    },
  });

  const uniqueDirectionIds = [...new Set(directionMemberIds)];

  for (const userId of uniqueDirectionIds) {
    await tx.rhTeamMember.upsert({
      where: { teamId_userId: { teamId: DIRECTION_TEAM_ID, userId } },
      create: { teamId: DIRECTION_TEAM_ID, userId },
      update: {},
    });
  }

  const stale = await tx.rhTeamMember.findMany({
    where: { teamId: DIRECTION_TEAM_ID, userId: { notIn: uniqueDirectionIds } },
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
    `[seed] Direction : directeur ${DIRECTOR_LOGIN_EMAIL} + ${uniqueDirectionIds.length - 1} adjoint(s) (équipe = ${uniqueDirectionIds.length} membres).`,
  );

  return director.id;
}

module.exports = {
  seedDirectionTeam,
  DIRECTION_ORG_UNIT_ID,
  DIRECTION_TEAM_ID,
  DIRECTOR_LOGIN_EMAIL,
  DIRECTION_STAFF,
  POLE_STAFF_REASSIGNMENTS,
};
