/**
 * Seed référentiel postes & qualifications par pôle + backfill complet fiches staff démo.
 */
const {
  RH_POSITIONS,
  RH_QUALIFICATIONS,
  DIRECTION_TEAM_ASSIGNMENTS,
  FORMATEUR_DEMO_ASSIGNMENTS,
  FORMATEUR_PARTNER_ASSIGNMENT,
  PEDAGOGICAL_STAFF_ASSIGNMENTS,
  HR_ADMIN_STAFF_ASSIGNMENTS,
  DIRECTOR_LOGIN_EMAIL,
  SUPERADMIN_LOGIN_EMAIL,
  SUPERADMIN_DEFAULT_AVATAR,
  landingBioForPosition,
} = require('./rh-metier-catalog');
const { dedupeRhPositionsInTx } = require('./dedupe-rh-positions');
const { findUserByAppLogin } = require('./user-email-fields');
const { DIRECTION_TEAM_ID } = require('./direction-team-seed');

function joinQualLabels(codes, qualByCode) {
  return codes
    .map((c) => qualByCode.get(c)?.label)
    .filter(Boolean)
    .join(' · ');
}

function pickAssignment(list, index) {
  return list[index % list.length];
}

async function applyCollaborateurMetier(
  tx,
  userId,
  pos,
  qualification,
  service,
  positionCode,
) {
  const landingPresentation = landingBioForPosition(positionCode, pos.label, qualification);
  await tx.user.update({
    where: { id: userId },
    data: {
      jobFunction: pos.label,
      jobPositionId: pos.id,
      qualification,
      landingPresentation,
    },
  });
  await tx.collaborateurProfile.upsert({
    where: { userId },
    create: {
      userId,
      schoolInternalService: service,
      jobFunction: pos.label,
      qualification,
    },
    update: {
      schoolInternalService: service,
      jobFunction: pos.label,
      qualification,
    },
  });
}

function formateurCertifications(specialties) {
  const certs = [];
  for (const s of specialties) {
    if (/SSIAP/i.test(s)) certs.push(s.replace(/\s*&\s*évacuation/i, '').trim());
    else if (/SST/i.test(s)) certs.push('SST');
    else if (/TFPAPS/i.test(s)) certs.push('TFPAPS');
    else if (/électri/i.test(s)) certs.push('Habilitations électriques');
    else if (/hauteur/i.test(s)) certs.push('Travail en hauteur');
    else if (s.length <= 40) certs.push(s);
  }
  return [...new Set(certs)].slice(0, 4);
}

async function applyFormateurMetier(
  tx,
  userId,
  pos,
  qualification,
  specialties,
  positionCode,
  yearsOfExperience,
) {
  const landingPresentation = landingBioForPosition(
    positionCode,
    pos.label,
    qualification,
    specialties,
  );
  const certifications = formateurCertifications(specialties);
  await tx.user.update({
    where: { id: userId },
    data: {
      jobFunction: pos.label,
      jobPositionId: pos.id,
      qualification,
      landingPresentation,
    },
  });
  await tx.formateurProfile.upsert({
    where: { userId },
    create: {
      userId,
      isInternal: true,
      schoolInternalService: 'TRAINER_POOL',
      specialties,
      speciality: specialties[0] ?? null,
      certifications,
      yearsOfExperience,
    },
    update: {
      schoolInternalService: 'TRAINER_POOL',
      specialties,
      speciality: specialties[0] ?? null,
      certifications,
      yearsOfExperience,
    },
  });
}

async function backfillDirectionTeam(tx, posByCode, qualByCode) {
  const directorRow = await findUserByAppLogin(tx, DIRECTOR_LOGIN_EMAIL);
  const teamMembers = await tx.rhTeamMember.findMany({
    where: { teamId: DIRECTION_TEAM_ID },
    include: {
      user: {
        select: { id: true, email: true, proEmail: true, createdAt: true },
      },
    },
  });

  const ordered = teamMembers
    .map((m) => m.user)
    .filter(Boolean)
    .sort((a, b) => {
      if (directorRow?.id && a.id === directorRow.id) return -1;
      if (directorRow?.id && b.id === directorRow.id) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  for (let i = 0; i < ordered.length; i += 1) {
    const assignment = pickAssignment(DIRECTION_TEAM_ASSIGNMENTS, i);
    const pos = posByCode.get(assignment.positionCode);
    if (!pos) continue;
    const qualification = joinQualLabels(assignment.qualificationCodes, qualByCode);
    await applyCollaborateurMetier(
      tx,
      ordered[i].id,
      pos,
      qualification,
      'DIRECTION',
      assignment.positionCode,
    );
  }

  return ordered.length;
}

async function backfillFormateurs(tx, posByCode, qualByCode) {
  const formateurs = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      role: { slug: 'formateur' },
    },
    select: { id: true, userCategory: true },
    orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
  });

  for (let i = 0; i < formateurs.length; i += 1) {
    const f = formateurs[i];
    const assignment =
      f.userCategory === 'SUBCONTRACTOR'
        ? FORMATEUR_PARTNER_ASSIGNMENT
        : pickAssignment(FORMATEUR_DEMO_ASSIGNMENTS, i);
    const pos = posByCode.get(assignment.positionCode);
    if (!pos) continue;
    const qualification = joinQualLabels(assignment.qualificationCodes, qualByCode);
    const specialties = assignment.specialties ?? [];
    await applyFormateurMetier(
      tx,
      f.id,
      pos,
      qualification,
      specialties,
      assignment.positionCode,
      6 + (i % 14),
    );
  }

  return formateurs.length;
}

async function backfillPoleStaff(tx, posByCode, qualByCode, service, assignments, roleSlugs) {
  const [directorRow, superadminRow] = await Promise.all([
    findUserByAppLogin(tx, DIRECTOR_LOGIN_EMAIL),
    findUserByAppLogin(tx, SUPERADMIN_LOGIN_EMAIL),
  ]);
  const excludeIds = [directorRow?.id, superadminRow?.id].filter(Boolean);

  const users = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      role: { slug: { in: roleSlugs } },
      collaborateurProfile: { schoolInternalService: service },
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    },
    select: { id: true },
    orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
  });

  for (let i = 0; i < users.length; i += 1) {
    const assignment = pickAssignment(assignments, i);
    const pos = posByCode.get(assignment.positionCode);
    if (!pos) continue;
    const qualification = joinQualLabels(assignment.qualificationCodes, qualByCode);
    await applyCollaborateurMetier(
      tx,
      users[i].id,
      pos,
      qualification,
      service,
      assignment.positionCode,
    );
  }

  return users.length;
}

async function backfillSuperadmin(tx, posByCode, qualByCode) {
  const samir = await findUserByAppLogin(tx, SUPERADMIN_LOGIN_EMAIL);
  if (!samir?.id) return 0;

  const pos = posByCode.get('ADM_IT');
  if (!pos) return 0;
  const qualification = joinQualLabels(['ADM_IT', 'ADM_SCOLARITE'], qualByCode);
  const landingPresentation = landingBioForPosition('ADM_IT', pos.label, qualification);
  const avatar =
    samir.avatar?.trim() || SUPERADMIN_DEFAULT_AVATAR;
  await tx.user.update({
    where: { id: samir.id },
    data: {
      jobFunction: pos.label,
      jobPositionId: pos.id,
      qualification,
      landingPresentation,
      avatar,
    },
  });
  await tx.collaborateurProfile.upsert({
    where: { userId: samir.id },
    create: {
      userId: samir.id,
      schoolInternalService: 'HR_ADMIN',
      jobFunction: pos.label,
      qualification,
    },
    update: {
      schoolInternalService: 'HR_ADMIN',
      jobFunction: pos.label,
      qualification,
    },
  });
  return 1;
}

async function backfillAdminsWithoutPole(tx, posByCode, qualByCode) {
  const directorRow = await findUserByAppLogin(tx, DIRECTOR_LOGIN_EMAIL);
  const admins = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      role: { slug: 'admin' },
      ...(directorRow?.id ? { id: { not: directorRow.id } } : {}),
      OR: [
        { collaborateurProfile: null },
        { collaborateurProfile: { schoolInternalService: null } },
        { jobPositionId: null },
        { jobFunction: null },
        { qualification: null },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const pos = posByCode.get('ADM_GENERAL');
  if (!pos) return 0;
  const qualification = joinQualLabels(['ADM_SCOLARITE', 'ADM_ACCUEIL'], qualByCode);

  for (const u of admins) {
    await applyCollaborateurMetier(tx, u.id, pos, qualification, 'HR_ADMIN', 'ADM_GENERAL');
  }
  return admins.length;
}

async function seedRhMetierReferential(tx) {
  for (const p of RH_POSITIONS) {
    await tx.rhPosition.upsert({
      where: { code: p.code },
      create: p,
      update: {
        label: p.label,
        sortOrder: p.sortOrder,
        schoolInternalService: p.schoolInternalService,
      },
    });
  }

  for (const q of RH_QUALIFICATIONS) {
    await tx.rhQualification.upsert({
      where: { code: q.code },
      create: q,
      update: {
        label: q.label,
        sortOrder: q.sortOrder,
        schoolInternalService: q.schoolInternalService,
      },
    });
  }

  const qualByCode = new Map(
    (await tx.rhQualification.findMany({ select: { code: true, label: true } })).map((q) => [
      q.code,
      q,
    ]),
  );

  const posByCode = new Map(
    (await tx.rhPosition.findMany({ select: { id: true, code: true, label: true } })).map((p) => [
      p.code,
      p,
    ]),
  );

  const directionCount = await backfillDirectionTeam(tx, posByCode, qualByCode);
  const formateurCount = await backfillFormateurs(tx, posByCode, qualByCode);
  const pedCount = await backfillPoleStaff(
    tx,
    posByCode,
    qualByCode,
    'PEDAGOGICAL',
    PEDAGOGICAL_STAFF_ASSIGNMENTS,
    ['collaborateur'],
  );
  const hrCount = await backfillPoleStaff(
    tx,
    posByCode,
    qualByCode,
    'HR_ADMIN',
    HR_ADMIN_STAFF_ASSIGNMENTS,
    ['collaborateur', 'admin'],
  );
  const superadminCount = await backfillSuperadmin(tx, posByCode, qualByCode);
  const orphanAdminCount = await backfillAdminsWithoutPole(tx, posByCode, qualByCode);

  console.log(
    `[seed] Référentiel métier : ${RH_POSITIONS.length} postes, ${RH_QUALIFICATIONS.length} qualifications.`,
  );
  console.log(
    `[seed] Fiches complétées — direction: ${directionCount}, formateurs: ${formateurCount}, pédagogie: ${pedCount}, RH/admin: ${hrCount}, superadmin: ${superadminCount}, admins orphelins: ${orphanAdminCount}.`,
  );

  const dedupeStats = await dedupeRhPositionsInTx(tx);
  if (dedupeStats.positionsDeleted > 0) {
    console.log(
      `[seed] RhPosition — ${dedupeStats.positionsDeleted} doublon(s) fusionné(s), ${dedupeStats.usersReassigned} user(s) réassigné(s).`,
    );
  }
}

module.exports = { seedRhMetierReferential };
