/**
 * Identifiants francais simules pour seed demo (NIR, CNI, passeport, titre de sejour).
 * Formats alignes sur regles officielles INSEE / CNAPS — valeurs fictives uniquement.
 */

/** Codes commune INSEE simplifies (dept + commune sur 5 chiffres dans le NIR). */
const COMMUNE_CODES = {
  '75': '101',
  '69': '123',
  '13': '201',
  '31': '055',
  '33': '063',
  '59': '083',
  '67': '082',
  '92': '050',
  '44': '109',
};

const FOREIGN_BIRTH = {
  Algerienne: { dept: '99', commune: '352', country: 'Algerie', permitPrefix: 'DZA' },
  Marocaine: { dept: '99', commune: '504', country: 'Maroc', permitPrefix: 'MAR' },
  Espagnole: { dept: '99', commune: '724', country: 'Espagne', permitPrefix: 'ESP' },
};

/** 6 scenarios pour alterner conformite (validite / expiration). */
const IDENTITY_SCENARIOS = [
  {
    id: 'CNI_VALID',
    identityDocumentType: 'CNI',
    nationality: 'Francaise',
    birthCountry: 'France',
    expiryOffsetMonths: 48,
    frenchLevelProof: null,
    requiresResidencePermit: false,
  },
  {
    id: 'CNI_EXPIRED',
    identityDocumentType: 'CNI',
    nationality: 'Francaise',
    birthCountry: 'France',
    expiryOffsetMonths: -8,
    frenchLevelProof: null,
    requiresResidencePermit: false,
  },
  {
    id: 'PASSPORT_VALID',
    identityDocumentType: 'PASSPORT',
    nationality: 'Francaise',
    birthCountry: 'France',
    expiryOffsetMonths: 60,
    frenchLevelProof: null,
    requiresResidencePermit: false,
  },
  {
    id: 'TITRE_SEJOUR_VALID',
    identityDocumentType: 'TITRE_SEJOUR',
    nationality: 'Algerienne',
    birthCountry: 'Algerie',
    expiryOffsetMonths: 24,
    frenchLevelProof: 'DELF B1 — certificat seed 2024',
    requiresResidencePermit: true,
    foreignKey: 'Algerienne',
  },
  {
    id: 'TITRE_SEJOUR_EXPIRED',
    identityDocumentType: 'TITRE_SEJOUR',
    nationality: 'Marocaine',
    birthCountry: 'Maroc',
    expiryOffsetMonths: -4,
    frenchLevelProof: 'TCF B1 — certificat seed 2023',
    requiresResidencePermit: true,
    foreignKey: 'Marocaine',
  },
  {
    id: 'UE_ID_VALID',
    identityDocumentType: 'UE_ID',
    nationality: 'Espagnole',
    birthCountry: 'Espagne',
    expiryOffsetMonths: 36,
    frenchLevelProof: 'Diplome francophone — seed',
    requiresResidencePermit: false,
    foreignKey: 'Espagnole',
  },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

function normalizeDeptForNir(dept) {
  const d = String(dept || '75').trim().toUpperCase();
  if (d === '2A') return '19';
  if (d === '2B') return '18';
  if (/^\d$/.test(d)) return pad2(Number(d));
  return d.slice(0, 2);
}

function deptCommuneCode(dept, seed) {
  const normalized = normalizeDeptForNir(dept);
  const commune = COMMUNE_CODES[normalized] || pad3(100 + (seed % 800));
  return `${normalized}${commune}`.slice(0, 5).padEnd(5, '0');
}

/** NIR 15 chiffres — clé = 97 - (NIR13 mod 97). */
function generateNir(input) {
  const sexDigit = input.civility === 'MME' ? '2' : '1';
  const [year, month] = input.birthDate.split('-');
  const yy = year.slice(-2);
  const mm = month;
  let deptCommune;

  if (input.foreignKey && FOREIGN_BIRTH[input.foreignKey]) {
    const f = FOREIGN_BIRTH[input.foreignKey];
    deptCommune = `${f.dept}${f.commune}`;
  } else {
    deptCommune = deptCommuneCode(input.birthDepartment || '75', input.seed);
  }

  const order = pad3((input.seed % 997) + 1);
  const nir13 = `${sexDigit}${yy}${mm}${deptCommune}${order}`;
  const key = Number(97n - (BigInt(nir13) % 97n));
  return `${nir13}${pad2(key)}`;
}

/** Numero carte CNI (support) — format demo 9AXXXXXXX. */
function generateCniNumber(seed, dept) {
  const d = normalizeDeptForNir(dept || '75');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const a = letters[seed % letters.length];
  const b = letters[(seed * 7) % letters.length];
  const num = String(100000 + (seed * 7919) % 899999);
  return `${d}${a}${b}${num.slice(0, 6)}`;
}

/** Passeport francais — 2 chiffres + 2 lettres + 5 chiffres. */
function generatePassportNumber(seed) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = pad2(10 + (seed % 80));
  const a = letters[seed % letters.length];
  const b = letters[(seed * 3) % letters.length];
  const tail = String(10000 + (seed * 3571) % 89999);
  return `${prefix}${a}${b}${tail}`;
}

/**
 * Titre de sejour — numero demo type prefet (10 chiffres + serie).
 * Ex. 9925XXXXXXXX pour etrangers.
 */
function generateResidencePermitNumber(seed, foreignKey) {
  const prefix = FOREIGN_BIRTH[foreignKey]?.permitPrefix || 'TS';
  const year = 20 + (seed % 5);
  const serial = String(10000000 + (seed * 12345) % 89999999);
  return `${prefix}${year}${serial.slice(0, 8)}`;
}

function addMonths(isoDate, months) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function pickScenario(seedIndex) {
  return IDENTITY_SCENARIOS[seedIndex % IDENTITY_SCENARIOS.length];
}

/**
 * Enrichit un profil base (civility, birthDate, birthDepartment, ...) avec identifiants alternes.
 */
function enrichProfileWithIdentity(baseProfile, seedIndex) {
  const scenario = pickScenario(seedIndex);
  const seed = seedIndex + hashString(baseProfile.email || `${seedIndex}`);

  const foreign = scenario.foreignKey ? FOREIGN_BIRTH[scenario.foreignKey] : null;
  const birthCountry = foreign?.country ?? baseProfile.birthCountry ?? 'France';
  const birthDepartment = foreign ? null : baseProfile.birthDepartment ?? '75';
  const nationality = scenario.nationality;

  let identityDocumentNumber;
  if (scenario.identityDocumentType === 'CNI') {
    identityDocumentNumber = generateCniNumber(seed, birthDepartment || '75');
  } else if (scenario.identityDocumentType === 'PASSPORT') {
    identityDocumentNumber = generatePassportNumber(seed);
  } else if (scenario.identityDocumentType === 'TITRE_SEJOUR') {
    identityDocumentNumber = generateResidencePermitNumber(seed, scenario.foreignKey);
  } else {
    identityDocumentNumber = generatePassportNumber(seed + 11);
  }

  const today = new Date();
  const expiry = new Date(today);
  expiry.setUTCMonth(expiry.getUTCMonth() + scenario.expiryOffsetMonths);
  const expiryIso = expiry.toISOString().slice(0, 10);

  const nir = generateNir({
    civility: baseProfile.civility,
    birthDate: baseProfile.birthDate,
    birthDepartment,
    foreignKey: scenario.foreignKey,
    seed,
  });

  const residencePermitNumber = scenario.requiresResidencePermit
    ? identityDocumentNumber
    : null;
  const residencePermitExpiry = scenario.requiresResidencePermit ? expiryIso : null;

  let cniNumber = null;
  if (scenario.identityDocumentType === 'CNI') {
    cniNumber = identityDocumentNumber;
  } else if (scenario.identityDocumentType === 'PASSPORT' || scenario.identityDocumentType === 'UE_ID') {
    cniNumber = identityDocumentNumber;
  } else if (scenario.requiresResidencePermit) {
    cniNumber = generatePassportNumber(seed + 17);
  }

  return {
    ...baseProfile,
    nationality,
    birthCountry,
    birthDepartment: birthDepartment ?? baseProfile.birthDepartment,
    birthCity:
      baseProfile.birthCity ||
      (foreign ? foreign.country : baseProfile.birthCity) ||
      'Paris',
    socialSecurityNumber: nir,
    identityDocumentType: scenario.identityDocumentType,
    identityDocumentNumber,
    identityDocumentExpiry: expiryIso,
    identityScenario: scenario.id,
    identityValid: scenario.expiryOffsetMonths > 0,
    frenchLevelProof: scenario.frenchLevelProof,
    residencePermitNumber,
    residencePermitExpiry,
    cniNumber,
  };
}

function hashString(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/** Carte pro CNAPS formateur / agent — alternance validite. */
function generateCartePro(seed, valid) {
  const year = valid ? 2028 : 2023;
  const serial = String(1000000 + (seed * 4321) % 8999999);
  return {
    carteProNumber: `CNAPS-${year}-${serial}`,
    carteProExpiry: valid ? `${year}-12-31` : '2023-06-30',
    carteProValid: valid,
  };
}

module.exports = {
  IDENTITY_SCENARIOS,
  enrichProfileWithIdentity,
  generateNir,
  generateCniNumber,
  generatePassportNumber,
  generateResidencePermitNumber,
  generateCartePro,
  addMonths,
};
