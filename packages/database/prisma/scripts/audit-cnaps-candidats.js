/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function loadRootEnv() {
  const candidates = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    break;
  }
}

loadRootEnv();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require(path.join(__dirname, '../../generated/client'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PDF_FIELDS = [
  { key: 'civility', label: 'Civilite', check: (ctx) => ctx.civility },
  { key: 'lastName', label: 'Nom', check: (ctx) => ctx.lastName },
  { key: 'firstName', label: 'Prenom', check: (ctx) => ctx.firstName },
  { key: 'birthDate', label: 'Date naissance', check: (ctx) => ctx.birthDate },
  { key: 'birthCity', label: 'Ville naissance', check: (ctx) => ctx.birthCity },
  {
    key: 'birthDepartment',
    label: 'Dept naissance (FR)',
    check: (ctx) => !ctx.needsDept || ctx.birthDepartment,
  },
  { key: 'address', label: 'Adresse', check: (ctx) => ctx.address },
  { key: 'postalCode', label: 'Code postal', check: (ctx) => ctx.postalCode },
  { key: 'city', label: 'Commune', check: (ctx) => ctx.city },
  { key: 'formation', label: 'Formation', check: (ctx) => ctx.formationLabel },
];

const IDENTITY_FIELDS = [
  { key: 'nir', label: 'NIR (15 chiffres)', check: (ctx) => ctx.nirOk },
  { key: 'identityDoc', label: 'Piece identite', check: (ctx) => ctx.identityDocOk },
  {
    key: 'residencePermit',
    label: 'Titre sejour (etranger)',
    check: (ctx) => !ctx.needsResidencePermit || ctx.residencePermitOk,
  },
];

function parseOnboarding(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  const onboarding =
    metadata.onboarding && typeof metadata.onboarding === 'object'
      ? metadata.onboarding
      : {};
  return onboarding;
}

function isFrenchBirth(birthCountry, nationality) {
  const c = (birthCountry || '').trim().toLowerCase();
  if (c === 'france' || c === 'fr') return true;
  const n = (nationality || '').trim().toLowerCase();
  return /franc|france/.test(n);
}

function isValidNir(nir) {
  if (!nir || !/^\d{15}$/.test(String(nir).replace(/\s/g, ''))) return false;
  const s = String(nir).replace(/\s/g, '');
  const body = s.slice(0, 13);
  const key = Number(s.slice(13));
  const mod = Number(BigInt(body) % 97n);
  return key === 97 - mod;
}

function buildContext(user, candidature, staffMeta) {
  const onboarding = parseOnboarding(candidature?.metadata);
  const meta = staffMeta && typeof staffMeta === 'object' ? staffMeta : {};
  const merged = { ...meta, ...onboarding };
  const birthCountry = merged.birthCountry || null;
  const nationality = user.nationality || merged.nationality || null;
  const birthPlace = user.birthPlace || merged.birthPlace || null;
  let birthCity = merged.birthCity || null;
  let birthDepartment = merged.birthDepartment || null;
  if (!birthCity && birthPlace) {
    const m = birthPlace.match(/^(.+?)\s*\((\d{2,3}|2A|2B)\)/i);
    if (m) {
      birthCity = m[1].trim();
      birthDepartment = birthDepartment || m[2].toUpperCase();
    } else {
      birthCity = birthPlace.split(',')[0]?.trim() || birthPlace;
    }
  }

  const nir = user.socialSecurityNumber?.trim() || merged.socialSecurityNumber?.trim() || null;
  const identityType = merged.identityDocumentType || null;
  const identityNumber =
    merged.identityDocumentNumber?.trim() ||
    user.cniNumber?.trim() ||
    null;
  const needsResidencePermit =
    identityType === 'TITRE_SEJOUR' ||
    Boolean(user.residencePermitNumber?.trim()) ||
    Boolean(merged.residencePermitNumber?.trim());

  return {
    email: user.email,
    civility: merged.civility || null,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate || merged.birthDate || null,
    birthCity,
    birthDepartment,
    birthCountry,
    nationality,
    needsDept: isFrenchBirth(birthCountry, nationality),
    address: user.address || merged.address || null,
    postalCode: user.postalCode || merged.postalCode || null,
    city: user.city || merged.city || null,
    formationLabel: candidature?.formation?.name || null,
    hasCandidature: Boolean(candidature),
    nirOk: isValidNir(nir),
    identityDocOk: Boolean(identityType && identityNumber),
    needsResidencePermit,
    residencePermitOk: Boolean(
      (user.residencePermitNumber || merged.residencePermitNumber)?.trim() &&
        (user.residencePermitExpiry || merged.residencePermitExpiry),
    ),
    identityScenario: merged.identityScenario || null,
    identityValid: merged.identityValid ?? null,
  };
}

function auditUserLine(ctx, roleLabel, includePdfFields) {
  const missingPdf = includePdfFields
    ? PDF_FIELDS.filter((f) => !f.check(ctx)).map((f) => f.label)
    : [];
  const missingId = IDENTITY_FIELDS.filter((f) => !f.check(ctx)).map((f) => f.label);
  const missing = [...missingPdf, ...missingId];
  if (roleLabel === 'candidat' && !ctx.hasCandidature) missing.push('Candidature');

  const status =
    missing.length === 0
      ? ctx.identityValid === false
        ? '[OK exp]'
        : '[OK]'
      : '[KO]';
  const expiryNote =
    ctx.identityValid === false ? ' (piece expiree — conformite KO attendue)' : '';
  const scenario = ctx.identityScenario ? ` scenario=${ctx.identityScenario}` : '';

  if (missing.length === 0) {
    console.log(`${status} ${ctx.email}${scenario}${expiryNote}`);
  } else {
    console.log(`${status} ${ctx.email} -> ${missing.join(', ')}${scenario}`);
  }
  return missing.length === 0;
}

async function auditRole(roleSlug, includePdfFields) {
  const role = await prisma.userRole.findFirst({
    where: { slug: roleSlug },
    select: { id: true },
  });
  if (!role) {
    console.log(`Role ${roleSlug} introuvable.\n`);
    return { total: 0, ok: 0 };
  }

  const staffInclude =
    roleSlug === 'collaborateur'
      ? { collaborateurProfile: { select: { metadata: true } } }
      : roleSlug === 'formateur'
        ? { formateurProfile: { select: { metadata: true } } }
        : {};

  const users = await prisma.user.findMany({
    where: { roleId: role.id, isTrashed: false },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      birthPlace: true,
      nationality: true,
      address: true,
      postalCode: true,
      city: true,
      socialSecurityNumber: true,
      cniNumber: true,
      residencePermitNumber: true,
      residencePermitExpiry: true,
      ...staffInclude,
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
    orderBy: { email: 'asc' },
  });

  console.log(`--- ${roleSlug} (${users.length}) ---`);
  let ok = 0;
  for (const user of users) {
    const candidature = user.candidatures[0] ?? null;
    const staffMeta =
      user.collaborateurProfile?.metadata || user.formateurProfile?.metadata || null;
    const ctx = buildContext(user, candidature, staffMeta);
    if (!includePdfFields) {
      ctx.hasCandidature = true;
      ctx.formationLabel = 'n/a';
    }
    if (auditUserLine(ctx, roleSlug, includePdfFields)) ok += 1;
  }
  console.log(`Resume ${roleSlug}: ${ok}/${users.length} complets\n`);
  return { total: users.length, ok };
}

async function main() {
  const settings = await prisma.systemSetting.findFirst({
    select: { siret: true, cnaps: true, name: true },
  });

  console.log('=== Audit identite CNAPS / conformite ===');
  console.log(`Ecole: ${settings?.name || '?'}`);
  console.log(`SIRET: ${settings?.siret?.trim() || 'MANQUANT'}`);
  console.log(`Agrement CNAPS: ${settings?.cnaps?.trim() || 'MANQUANT'}\n`);

  await auditRole('candidat', true);
  await auditRole('collaborateur', false);
  await auditRole('formateur', false);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
