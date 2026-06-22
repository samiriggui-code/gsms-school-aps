import type {
  CnapsHousingStatus,
  CnapsIdentityDocumentType,
  CnapsOnboardingCivility,
  CnapsRequestType,
} from '@/lib/cnaps/cnaps-onboarding-fields';

export type ParsedOnboardingIdentity = {
  cnapsRequestType: CnapsRequestType | null;
  birthDate: string | null;
  birthCity: string | null;
  birthDepartment: string | null;
  birthCountry: string | null;
  birthPlace: string | null;
  nationality: string | null;
  country: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  civility: CnapsOnboardingCivility | null;
  usageName: string | null;
  identityDocumentType: CnapsIdentityDocumentType | null;
  identityDocumentNumber: string | null;
  identityDocumentExpiry: string | null;
  housingStatus: CnapsHousingStatus | null;
  frenchLevelProof: string | null;
  residencePermitNumber: string | null;
  residencePermitExpiry: string | null;
};

function parseAddressLine(raw: string | null): { address: string; postalCode: string | null; city: string | null } {
  if (!raw?.trim()) return { address: '', postalCode: null, city: null };
  const match = raw.match(/^(.+?),\s*(\d{5})\s+(.+)$/);
  if (match) {
    return { address: match[1].trim(), postalCode: match[2], city: match[3].trim() };
  }
  return { address: raw.trim(), postalCode: null, city: null };
}

function parseBirthPlace(raw: string | null): {
  birthCity: string | null;
  birthDepartment: string | null;
  birthCountry: string | null;
} {
  if (!raw?.trim()) return { birthCity: null, birthDepartment: null, birthCountry: null };
  const text = raw.trim();
  const deptParen = text.match(/^(.+?)\s*\((\d{2,3}|2A|2B)\)\s*$/i);
  if (deptParen) {
    return { birthCity: deptParen[1].trim(), birthDepartment: deptParen[2].toUpperCase(), birthCountry: 'France' };
  }
  if (text.includes(',')) {
    const [city, rest] = text.split(',').map((s) => s.trim());
    return { birthCity: city || text, birthDepartment: null, birthCountry: rest || null };
  }
  return { birthCity: text, birthDepartment: null, birthCountry: null };
}

export function parseCandidatureOnboardingNotes(notes: string | null | undefined): ParsedOnboardingIdentity {
  const text = notes ?? '';
  const birthDate = /Date de naissance:\s*(.+)/i.exec(text)?.[1]?.trim() ?? null;
  const birthPlaceLine = /Lieu de naissance:\s*(.+)/i.exec(text)?.[1]?.trim() ?? null;
  const birthCityLine = /Ville de naissance:\s*(.+)/i.exec(text)?.[1]?.trim() ?? null;
  const birthDeptLine = /Departement de naissance:\s*(.+)/i.exec(text)?.[1]?.trim() ?? null;
  const birthCountryLine = /Pays de naissance:\s*(.+)/i.exec(text)?.[1]?.trim() ?? null;
  const nationality = /Nationalite:\s*(.+)/i.exec(text)?.[1]?.trim() ?? null;
  const addressRaw = /Adresse:\s*(.+)/i.exec(text)?.[1]?.trim() ?? null;
  const parsedAddress = parseAddressLine(addressRaw);
  const parsedBirth = parseBirthPlace(birthPlaceLine);

  return {
    cnapsRequestType: null,
    birthDate,
    birthCity: birthCityLine ?? parsedBirth.birthCity,
    birthDepartment: birthDeptLine ?? parsedBirth.birthDepartment,
    birthCountry: birthCountryLine ?? parsedBirth.birthCountry,
    birthPlace: birthPlaceLine,
    nationality,
    country: null,
    address: parsedAddress.address || null,
    postalCode: parsedAddress.postalCode,
    city: parsedAddress.city,
    civility: null,
    usageName: null,
    identityDocumentType: null,
    identityDocumentNumber: null,
    identityDocumentExpiry: null,
    housingStatus: null,
    frenchLevelProof: null,
    residencePermitNumber: null,
    residencePermitExpiry: null,
  };
}

export function parseCandidatureOnboardingMetadata(metadata: unknown): Partial<ParsedOnboardingIdentity> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  const root = metadata as Record<string, unknown>;
  const onboarding =
    root.onboarding && typeof root.onboarding === 'object' && !Array.isArray(root.onboarding)
      ? (root.onboarding as Record<string, unknown>)
      : root;

  const civRaw = onboarding.civility;
  const civility: CnapsOnboardingCivility | null =
    civRaw === 'MME' || civRaw === 'F' || civRaw === 'Madame'
      ? 'MME'
      : civRaw === 'M' || civRaw === 'M.' || civRaw === 'Monsieur'
        ? 'M'
        : null;

  const birthPlace =
    typeof onboarding.birthPlace === 'string' ? onboarding.birthPlace : null;
  const fromLegacy = parseBirthPlace(birthPlace);

  const reqRaw = onboarding.cnapsRequestType;
  const cnapsRequestType: CnapsRequestType | null =
    reqRaw === 'PROVISOIRE' ? 'PROVISOIRE' : reqRaw === 'PREALABLE' ? 'PREALABLE' : null;

  const idTypeRaw = onboarding.identityDocumentType;
  const identityDocumentType: CnapsIdentityDocumentType | null =
    idTypeRaw === 'CNI' ||
    idTypeRaw === 'PASSPORT' ||
    idTypeRaw === 'TITRE_SEJOUR' ||
    idTypeRaw === 'UE_ID'
      ? idTypeRaw
      : null;

  const housingRaw = onboarding.housingStatus;
  const housingStatus: CnapsHousingStatus | null =
    housingRaw === 'TENANT' ||
    housingRaw === 'OWNER' ||
    housingRaw === 'HOSTED' ||
    housingRaw === 'OTHER'
      ? housingRaw
      : null;

  return {
    cnapsRequestType,
    birthDate: typeof onboarding.birthDate === 'string' ? onboarding.birthDate : null,
    birthCity:
      typeof onboarding.birthCity === 'string'
        ? onboarding.birthCity
        : fromLegacy.birthCity,
    birthDepartment:
      typeof onboarding.birthDepartment === 'string'
        ? onboarding.birthDepartment
        : fromLegacy.birthDepartment,
    birthCountry:
      typeof onboarding.birthCountry === 'string'
        ? onboarding.birthCountry
        : fromLegacy.birthCountry,
    birthPlace,
    nationality: typeof onboarding.nationality === 'string' ? onboarding.nationality : null,
    country: typeof onboarding.country === 'string' ? onboarding.country : null,
    address: typeof onboarding.address === 'string' ? onboarding.address : null,
    postalCode: typeof onboarding.postalCode === 'string' ? onboarding.postalCode : null,
    city: typeof onboarding.city === 'string' ? onboarding.city : null,
    civility,
    usageName: typeof onboarding.usageName === 'string' ? onboarding.usageName : null,
    identityDocumentType,
    identityDocumentNumber:
      typeof onboarding.identityDocumentNumber === 'string'
        ? onboarding.identityDocumentNumber
        : null,
    identityDocumentExpiry:
      typeof onboarding.identityDocumentExpiry === 'string'
        ? onboarding.identityDocumentExpiry
        : null,
    housingStatus,
    frenchLevelProof:
      typeof onboarding.frenchLevelProof === 'string' ? onboarding.frenchLevelProof : null,
    residencePermitNumber:
      typeof onboarding.residencePermitNumber === 'string'
        ? onboarding.residencePermitNumber
        : null,
    residencePermitExpiry:
      typeof onboarding.residencePermitExpiry === 'string'
        ? onboarding.residencePermitExpiry
        : null,
  };
}

export function formatBirthDateFr(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, day] = value.split('-');
      return `${day}/${m}/${y}`;
    }
    return typeof value === 'string' ? value : null;
  }
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export { parseBirthPlace };
