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
} = require('./rh-metier-catalog');
const { dedupeRhPositionsInTx } = require('./dedupe-rh-positions');
const { findUserByAppLogin } = require('./user-email-fields');

function joinQualLabels(codes, qualByCode) {
  return codes
    .map((c) => qualByCode.get(c)?.label)
    .filter(Boolean)
    .join(' · ');
}

function pickAssignment(list, index) {
  return list[index % list.length];
}

async function applyCollaborateurMetier(tx, userId, pos, qualification, service) {
  await tx.user.update({
    where: { id: userId },
    data: {
      jobFunction: pos.label,
      jobPositionId: pos.id,
      qualification,
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

async function applyFormateurMetier(tx, userId, pos, qualification, specialties) {
  await tx.user.update({
    where: { id: userId },
    data: {
      jobFunction: pos.label,
      jobPositionId: pos.id,
      qualification,
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
    },
    update: {
      schoolInternalService: 'TRAINER_POOL',
      specialties,
      speciality: specialties[0] ?? null,
    },
  });
}

async function backfillDirectionTeam(tx, posByCode, qualByCode) {
  const directionUsers = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      collaborateurProfile: { schoolInternalService: 'DIRECTION' },
    },
    select: { id: true, email: true, proEmail: true, createdAt: true },
  });

  const directorRow = await findUserByAppLogin(tx, DIRECTOR_LOGIN_EMAIL);
  const director = directorRow
    ? directionUsers.find((u) => u.id === directorRow.id)
    : directionUsers.find((u) => u.proEmail === DIRECTOR_LOGIN_EMAIL);
  const others = directionUsers
    .filter((u) => u.id !== director?.id)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const ordered = director ? [director, ...others] : [...directionUsers].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  for (let i = 0; i < ordered.length; i += 1) {
    const assignment = pickAssignment(DIRECTION_TEAM_ASSIGNMENTS, i);
    const pos = posByCode.get(assignment.positionCode);
    if (!pos) continue;
    const qualification = joinQualLabels(assignment.qualificationCodes, qualByCode);
    await applyCollaborateurMetier(tx, ordered[i].id, pos, qualification, 'DIRECTION');
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
    await applyFormateurMetier(tx, f.id, pos, qualification, specialties);
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
    await applyCollaborateurMetier(tx, users[i].id, pos, qualification, service);
  }

  return users.length;
}

async function backfillSuperadmin(tx, posByCode, qualByCode) {
  const samir = await findUserByAppLogin(tx, SUPERADMIN_LOGIN_EMAIL);
  if (!samir?.id) return 0;

  const pos = posByCode.get('ADM_IT');
  if (!pos) return 0;
  const qualification = joinQualLabels(['ADM_IT', 'ADM_SCOLARITE'], qualByCode);
  await tx.user.update({
    where: { id: samir.id },
    data: {
      jobFunction: pos.label,
      jobPositionId: pos.id,
      qualification,
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
    await applyCollaborateurMetier(tx, u.id, pos, qualification, 'HR_ADMIN');
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
