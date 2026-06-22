/**
 * Profils identite complets (NIR, CNI, titre sejour) pour candidats, collaborateurs, formateurs.
 */

const {
  enrichProfileWithIdentity,
  generateCartePro,
} = require('./french-identity-simulation');
const { ensureUserEmailSplit, findUserByAppLogin } = require('./user-email-fields');

function buildOnboardingMetadata(profile, formationSlug) {
  const birthPlace = profile.birthDepartment
    ? `${profile.birthCity} (${profile.birthDepartment})`
    : `${profile.birthCity}, ${profile.birthCountry}`;

  return {
    cnapsRequestType: 'PREALABLE',
    civility: profile.civility,
    usageName: profile.usageName?.trim() || null,
    birthDate: profile.birthDate,
    birthCity: profile.birthCity,
    birthDepartment: profile.birthDepartment || null,
    birthCountry: profile.birthCountry,
    birthPlace,
    nationality: profile.nationality,
    country: 'France',
    address: profile.address,
    postalCode: profile.postalCode,
    city: profile.city,
    identityDocumentType: profile.identityDocumentType || null,
    identityDocumentNumber: profile.identityDocumentNumber || '',
    identityDocumentExpiry: profile.identityDocumentExpiry || null,
    housingStatus: null,
    frenchLevelProof: profile.frenchLevelProof || null,
    residencePermitNumber: profile.residencePermitNumber || null,
    residencePermitExpiry: profile.residencePermitExpiry || null,
    identityScenario: profile.identityScenario || null,
    identityValid: profile.identityValid ?? true,
    formationSlug: formationSlug || undefined,
  };
}

const DEMO_CNAPS_PROFILES = [
  {
    loginEmail: 'candidat.dev.1@ecole.local',
    civility: 'M',
    usageName: '',
    phone: '06 12 34 56 78',
    birthDate: '1992-03-15',
    birthCity: 'Lyon',
    birthDepartment: '69',
    birthCountry: 'France',
    nationality: 'Francaise',
    address: '12 rue de la Republique',
    postalCode: '69002',
    city: 'Lyon',
  },
  {
    loginEmail: 'candidat.dev.2@ecole.local',
    civility: 'MME',
    usageName: 'Martin',
    phone: '07 98 76 54 32',
    birthDate: '1988-11-02',
    birthCity: 'Nanterre',
    birthDepartment: '92',
    birthCountry: 'France',
    nationality: 'Francaise',
    address: '5 avenue de la Division Leclerc',
    postalCode: '92110',
    city: 'Clichy',
  },
  {
    loginEmail: 'matthew.clark@ecole.local',
    civility: 'M',
    usageName: '',
    phone: '06 45 67 89 01',
    birthDate: '1995-07-22',
    birthCity: 'Marseille',
    birthDepartment: '13',
    birthCountry: 'France',
    nationality: 'Francaise',
    address: '18 boulevard Longchamp',
    postalCode: '13001',
    city: 'Marseille',
  },
];

const FALLBACK_STREETS = [
  '8 rue Victor Hugo',
  '14 avenue Jean Jaures',
  '3 impasse des Lilas',
  '22 rue de la Gare',
  '7 place de la Mairie',
];

const FALLBACK_CITIES = [
  { city: 'Paris', postalCode: '75011', dept: '75', birthCity: 'Paris' },
  { city: 'Lille', postalCode: '59000', dept: '59', birthCity: 'Lille' },
  { city: 'Toulouse', postalCode: '31000', dept: '31', birthCity: 'Toulouse' },
  { city: 'Nantes', postalCode: '44000', dept: '44', birthCity: 'Nantes' },
  { city: 'Bordeaux', postalCode: '33000', dept: '33', birthCity: 'Bordeaux' },
  { city: 'Strasbourg', postalCode: '67000', dept: '67', birthCity: 'Strasbourg' },
];

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: 'Demo', lastName: 'User' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function hashEmail(email) {
  let h = 0;
  for (let i = 0; i < email.length; i += 1) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return h;
}

function buildFallbackProfile(user, index) {
  const { firstName, lastName } = splitName(user.name || user.email);
  const h = hashEmail(user.email);
  const loc = FALLBACK_CITIES[h % FALLBACK_CITIES.length];
  const street = FALLBACK_STREETS[h % FALLBACK_STREETS.length];
  const year = 1985 + (h % 15);
  const month = String((h % 12) + 1).padStart(2, '0');
  const day = String((h % 26) + 1).padStart(2, '0');

  return {
    email: user.email,
    civility: h % 2 === 0 ? 'M' : 'MME',
    usageName: '',
    phone: `06 ${String(10 + (h % 80)).padStart(2, '0')} ${String(20 + (h % 70)).padStart(2, '0')} ${String(30 + (h % 60)).padStart(2, '0')} ${String(40 + (h % 50)).padStart(2, '0')}`,
    birthDate: `${year}-${month}-${day}`,
    birthCity: loc.birthCity,
    birthDepartment: loc.dept,
    birthCountry: 'France',
    nationality: 'Francaise',
    address: street,
    postalCode: loc.postalCode,
    city: loc.city,
    firstName: user.firstName || firstName,
    lastName: user.lastName || lastName,
  };
}

function buildLeadNotes(profile, formationName) {
  const lines = [
    `Formation visee: ${formationName}`,
    `Date de naissance: ${profile.birthDate}`,
    `Ville de naissance: ${profile.birthCity}`,
    profile.birthDepartment ? `Departement de naissance: ${profile.birthDepartment}` : '',
    profile.birthCountry ? `Pays de naissance: ${profile.birthCountry}` : '',
    `Lieu de naissance: ${profile.birthDepartment ? `${profile.birthCity} (${profile.birthDepartment})` : `${profile.birthCity}, ${profile.birthCountry}`}`,
    `Nationalite: ${profile.nationality}`,
    `NIR: ${profile.socialSecurityNumber}`,
    profile.identityDocumentType
      ? `Piece identite (${profile.identityDocumentType}): ${profile.identityDocumentNumber} — validite ${profile.identityDocumentExpiry}${profile.identityValid ? '' : ' [EXPIREE seed]'}`
      : '',
    profile.residencePermitNumber
      ? `Titre sejour: ${profile.residencePermitNumber} — validite ${profile.residencePermitExpiry}`
      : '',
    profile.frenchLevelProof ? `Niveau francais: ${profile.frenchLevelProof}` : '',
    `Adresse: ${profile.address}, ${profile.postalCode} ${profile.city}`,
    `Scenario identite seed: ${profile.identityScenario}`,
  ];
  return lines.filter(Boolean).join('\n');
}

function userIdentityUpdateData(profile) {
  const birthPlace = profile.birthDepartment
    ? `${profile.birthCity} (${profile.birthDepartment})`
    : `${profile.birthCity}, ${profile.birthCountry}`;

  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    name: `${profile.firstName} ${profile.lastName}`.trim(),
    phone: profile.phone,
    birthDate: new Date(`${profile.birthDate}T00:00:00.000Z`),
    birthPlace,
    nationality: profile.nationality,
    country: 'France',
    address: profile.address,
    postalCode: profile.postalCode,
    city: profile.city,
    socialSecurityNumber: profile.socialSecurityNumber,
    cniNumber: profile.cniNumber || profile.identityDocumentNumber,
    residencePermitNumber: profile.residencePermitNumber,
    residencePermitExpiry: profile.residencePermitExpiry
      ? new Date(`${profile.residencePermitExpiry}T00:00:00.000Z`)
      : null,
  };
}

async function ensureSchoolCnapsSettings(prisma) {
  const row = await prisma.systemSetting.findFirst({
    select: { id: true, siret: true, cnaps: true, name: true },
  });
  if (row?.siret?.trim() && row?.cnaps?.trim()) return false;

  const defaultSettingsId = row?.id ?? 'default-system-setting';
  const patch = {
    name: row?.name?.trim() || "FORM'SSI SARL",
    address: '9 Avenue Alexandre Maistrasse, 92500 RUEIL-MALMAISON',
    companyCity: 'RUEIL-MALMAISON',
    companyPostalCode: '92500',
    siret: '85372584400015',
    cnaps: 'FOP-092-2023-09-13-20230855451',
  };

  await prisma.systemSetting.upsert({
    where: { id: defaultSettingsId },
    update: patch,
    create: { id: defaultSettingsId, ...patch },
  });
  console.log('[seed] Parametres ecole CNAPS (SIRET + agrement) completes.');
  return true;
}

async function seedCandidatProfiles(prisma, formation) {
  const candidatRole = await prisma.userRole.findFirst({
    where: { slug: 'candidat' },
    select: { id: true },
  });
  if (!candidatRole) return { updated: 0, skipped: 0, created: 0 };

  const demoByLogin = new Map(
    DEMO_CNAPS_PROFILES.map((p) => [p.loginEmail.toLowerCase(), p]),
  );

  const users = await prisma.user.findMany({
    where: { roleId: candidatRole.id, isTrashed: false },
    select: {
      id: true,
      email: true,
      proEmail: true,
      name: true,
      firstName: true,
      lastName: true,
      candidatures: {
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          metadata: true,
          formation: { select: { name: true, slug: true } },
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;
  let created = 0;

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    let candidature = user.candidatures[0] ?? null;

    if (!candidature && formation) {
      candidature = await prisma.candidature.create({
        data: {
          userId: user.id,
          formationId: formation.id,
          source: 'MANUAL',
          status: 'DRAFT',
          notes: `Candidature seed CNAPS — ${formation.name}`,
          metadata: {},
        },
        select: {
          id: true,
          metadata: true,
          formation: { select: { name: true, slug: true } },
        },
      });
      created += 1;
    }

    if (!candidature) {
      skipped += 1;
      continue;
    }

    const loginKey = (user.proEmail || user.email || '').toLowerCase();
    const explicit = demoByLogin.get(loginKey);
    const base = explicit
      ? {
          ...explicit,
          email: user.email,
          firstName: user.firstName || splitName(user.name).firstName,
          lastName: user.lastName || splitName(user.name).lastName,
        }
      : buildFallbackProfile(user, i);

    const profile = enrichProfileWithIdentity(base, i);

    await prisma.user.update({
      where: { id: user.id },
      data: userIdentityUpdateData(profile),
    });

    const formationName = candidature.formation?.name || 'Formation securite';
    const formationSlug = candidature.formation?.slug || undefined;
    const existingMeta =
      candidature.metadata && typeof candidature.metadata === 'object'
        ? candidature.metadata
        : {};

    await prisma.candidature.update({
      where: { id: candidature.id },
      data: {
        notes: buildLeadNotes(profile, formationName),
        metadata: {
          ...existingMeta,
          onboarding: buildOnboardingMetadata(profile, formationSlug),
        },
      },
    });

    updated += 1;
  }

  console.log(
    `[seed] Candidats: ${updated} profils identite, ${created} candidatures creees, ${skipped} ignores.`,
  );
  return { updated, skipped, created };
}

async function seedStaffProfiles(prisma, roleSlug) {
  const role = await prisma.userRole.findFirst({
    where: { slug: roleSlug },
    select: { id: true },
  });
  if (!role) return 0;

  const users = await prisma.user.findMany({
    where: { roleId: role.id, isTrashed: false },
    select: { id: true, email: true, name: true, firstName: true, lastName: true },
    orderBy: { email: 'asc' },
  });

  let count = 0;
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const base = buildFallbackProfile(user, i + 100);
    base.civility = i % 3 === 0 ? 'MME' : 'M';
    const profile = enrichProfileWithIdentity(base, i + roleSlug.length);

    const updateData = {
      ...userIdentityUpdateData(profile),
      jobFunction:
        roleSlug === 'formateur'
          ? 'Formateur securite incendie'
          : 'Collaborateur administratif',
      qualification: roleSlug === 'formateur' ? 'TFP APS · CNAPS' : 'Gestion RH',
    };

    if (roleSlug === 'formateur') {
      const carte = generateCartePro(i, i % 4 !== 1);
      updateData.carteProNumber = carte.carteProNumber;
      updateData.carteProExpiry = new Date(`${carte.carteProExpiry}T00:00:00.000Z`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const identityMeta = {
      civility: profile.civility,
      identityScenario: profile.identityScenario,
      identityDocumentType: profile.identityDocumentType,
      identityDocumentNumber: profile.identityDocumentNumber,
      identityDocumentExpiry: profile.identityDocumentExpiry,
      identityValid: profile.identityValid,
      socialSecurityNumber: profile.socialSecurityNumber,
      frenchLevelProof: profile.frenchLevelProof,
      residencePermitNumber: profile.residencePermitNumber,
      residencePermitExpiry: profile.residencePermitExpiry,
    };

    if (roleSlug === 'collaborateur') {
      const hireDate = new Date();
      hireDate.setUTCFullYear(hireDate.getUTCFullYear() - (i % 8));
      await prisma.collaborateurProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          employeeCode: `COL-${String(i + 1).padStart(4, '0')}`,
          hireDate,
          contractType: 'CDI',
          workTimeType: 'FULL_TIME',
          jobFunction: updateData.jobFunction,
          qualification: updateData.qualification,
          socialSecurityNumber: profile.socialSecurityNumber,
          cniNumber: profile.cniNumber || profile.identityDocumentNumber,
          residencePermitNumber: profile.residencePermitNumber,
          residencePermitExpiry: profile.residencePermitExpiry
            ? new Date(`${profile.residencePermitExpiry}T00:00:00.000Z`)
            : null,
          birthDate: updateData.birthDate,
          birthPlace: updateData.birthPlace,
          nationality: profile.nationality,
          address: profile.address,
          city: profile.city,
          postalCode: profile.postalCode,
          country: 'France',
          metadata: identityMeta,
        },
        update: {
          socialSecurityNumber: profile.socialSecurityNumber,
          cniNumber: profile.cniNumber || profile.identityDocumentNumber,
          residencePermitNumber: profile.residencePermitNumber,
          residencePermitExpiry: profile.residencePermitExpiry
            ? new Date(`${profile.residencePermitExpiry}T00:00:00.000Z`)
            : null,
          birthDate: updateData.birthDate,
          birthPlace: updateData.birthPlace,
          nationality: profile.nationality,
          address: profile.address,
          city: profile.city,
          postalCode: profile.postalCode,
          country: 'France',
          metadata: identityMeta,
        },
      });
    }

    if (roleSlug === 'formateur') {
      await prisma.formateurProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          isInternal: true,
          speciality: 'TFP APS · Surveillance',
          yearsOfExperience: 5 + (i % 12),
          metadata: identityMeta,
        },
        update: {
          metadata: identityMeta,
        },
      });
    }

    count += 1;
  }

  console.log(`[seed] ${roleSlug}: ${count} profils identite complets (NIR + pieces alternees).`);
  return count;
}

async function seedCnapsCandidatProfiles(prisma) {
  await ensureSchoolCnapsSettings(prisma);
  await ensureUserEmailSplit(prisma);
  const { ensureDirectorAccount } = require('./user-email-fields');
  await ensureDirectorAccount(prisma);

  const formation = await prisma.formation.findFirst({
    where: { slug: 'tfp-aps', status: 'ACTIVE' },
    select: { id: true, name: true, slug: true },
  });

  const candidats = await seedCandidatProfiles(prisma, formation);
  const collab = await seedStaffProfiles(prisma, 'collaborateur');
  const formateurs = await seedStaffProfiles(prisma, 'formateur');

  return {
    ...candidats,
    collaborateurs: collab,
    formateurs,
  };
}

module.exports = {
  seedCnapsCandidatProfiles,
  seedCandidatProfiles,
  seedStaffProfiles,
  ensureSchoolCnapsSettings,
  DEMO_CNAPS_PROFILES,
};
