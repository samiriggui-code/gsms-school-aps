/** Contrat onboarding candidat aligne sur dossier CNAPS (fev. 2026). */

import {
  type CnapsHousingStatus,
  type CnapsIdentityDocumentType,
  type CnapsRequestType,
  CNAPS_HOUSING_STATUS_LABELS,
  CNAPS_IDENTITY_DOCUMENT_LABELS,
  CNAPS_REQUEST_TYPE_LABELS,
} from '@/lib/cnaps/cnaps-form-requirements';

export type CnapsOnboardingCivility = 'M' | 'MME';

export type CnapsOnboardingIdentity = {
  cnapsRequestType: CnapsRequestType;
  civility: CnapsOnboardingCivility | null;
  firstName: string;
  lastName: string;
  usageName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthCity: string;
  birthDepartment: string | null;
  birthCountry: string | null;
  nationality: string;
  /** Pays de residence (delegation territoriale CNAPS). */
  country: string;
  address: string;
  postalCode: string;
  city: string;
  identityDocumentType: CnapsIdentityDocumentType | null;
  identityDocumentNumber: string;
  identityDocumentExpiry: string;
  housingStatus: CnapsHousingStatus | null;
  frenchLevelProof: string;
  residencePermitNumber: string;
  residencePermitExpiry: string;
};

export type CnapsOnboardingFieldKey = keyof CnapsOnboardingIdentity;

export const CNAPS_ONBOARDING_FIELD_LABELS: Record<CnapsOnboardingFieldKey, string> = {
  cnapsRequestType: 'Type de demande CNAPS',
  civility: 'Civilité (M. / Mme)',
  firstName: 'Prénom(s)',
  lastName: 'Nom de naissance',
  usageName: "Nom d'usage (optionnel)",
  email: 'Courriel',
  phone: 'Téléphone mobile',
  birthDate: 'Date de naissance',
  birthCity: 'Ville de naissance',
  birthDepartment: 'Département de naissance',
  birthCountry: 'Pays de naissance',
  nationality: 'Nationalité',
  country: 'Pays de résidence',
  address: 'Adresse (voie)',
  postalCode: 'Code postal',
  city: 'Commune',
  identityDocumentType: "Type de pièce d'identité",
  identityDocumentNumber: "Numéro de pièce d'identité",
  identityDocumentExpiry: "Date de validité de la pièce d'identité",
  housingStatus: 'Situation de logement (justificatif de domicile)',
  frenchLevelProof: 'Justificatif de niveau de français (B1 min.)',
  residencePermitNumber: 'Numéro du titre de séjour',
  residencePermitExpiry: 'Date de validité du titre de séjour',
};

const FR_NATIONALITY = /franc|france/i;

export function isFrenchNationality(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return FR_NATIONALITY.test(value.trim());
}

export function isFrenchBirthContext(input: {
  birthCountry?: string | null;
  nationality?: string | null;
}): boolean {
  const country = input.birthCountry?.trim().toLowerCase() ?? '';
  if (country === 'france' || country === 'fr') return true;
  if (!country && isFrenchNationality(input.nationality)) return true;
  return false;
}

export function composeBirthPlaceLine(input: {
  birthCity: string;
  birthDepartment?: string | null;
  birthCountry?: string | null;
  nationality?: string | null;
}): string {
  const city = input.birthCity.trim();
  if (!city) return '';

  const dept = input.birthDepartment?.trim().toUpperCase() || null;
  const country = input.birthCountry?.trim() || null;
  const bornInFrance = isFrenchBirthContext({
    birthCountry: country,
    nationality: input.nationality,
  });

  if (bornInFrance && dept) return `${city} (${dept})`;
  if (country && !/france/i.test(country)) return `${city}, ${country}`;
  return city;
}

export function composeCandidateAddressLine(input: {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
}): string {
  return [input.address, input.postalCode, input.city].filter(Boolean).join(', ');
}

export function parseFrenchPostalCode(value: string): string | null {
  const digits = value.replace(/\s/g, '');
  if (/^\d{5}$/.test(digits)) return digits;
  return null;
}

/** Champs collectes a la preinscription landing (identite + adresse pour dossier CNAPS). */
export type PreinscriptionIdentity = Pick<
  CnapsOnboardingIdentity,
  | 'civility'
  | 'firstName'
  | 'lastName'
  | 'usageName'
  | 'email'
  | 'phone'
  | 'birthDate'
  | 'birthCity'
  | 'birthDepartment'
  | 'birthCountry'
  | 'nationality'
  | 'address'
  | 'postalCode'
  | 'city'
>;

export type PreinscriptionFieldKey = keyof PreinscriptionIdentity;

export const PREINSCRIPTION_FIELD_LABELS: Record<PreinscriptionFieldKey, string> = {
  civility: CNAPS_ONBOARDING_FIELD_LABELS.civility,
  firstName: CNAPS_ONBOARDING_FIELD_LABELS.firstName,
  lastName: CNAPS_ONBOARDING_FIELD_LABELS.lastName,
  usageName: CNAPS_ONBOARDING_FIELD_LABELS.usageName,
  email: CNAPS_ONBOARDING_FIELD_LABELS.email,
  phone: CNAPS_ONBOARDING_FIELD_LABELS.phone,
  birthDate: CNAPS_ONBOARDING_FIELD_LABELS.birthDate,
  birthCity: CNAPS_ONBOARDING_FIELD_LABELS.birthCity,
  birthDepartment: CNAPS_ONBOARDING_FIELD_LABELS.birthDepartment,
  birthCountry: CNAPS_ONBOARDING_FIELD_LABELS.birthCountry,
  nationality: CNAPS_ONBOARDING_FIELD_LABELS.nationality,
  address: CNAPS_ONBOARDING_FIELD_LABELS.address,
  postalCode: CNAPS_ONBOARDING_FIELD_LABELS.postalCode,
  city: CNAPS_ONBOARDING_FIELD_LABELS.city,
};

export function assessPreinscriptionIdentity(
  input: Partial<PreinscriptionIdentity>,
): { complete: boolean; missing: string[] } {
  const missing: string[] = [];

  const require = (key: PreinscriptionFieldKey, value: string | null | undefined) => {
    if (!value?.trim()) missing.push(PREINSCRIPTION_FIELD_LABELS[key]);
  };

  if (!input.civility) missing.push(PREINSCRIPTION_FIELD_LABELS.civility);
  require('firstName', input.firstName);
  require('lastName', input.lastName);
  require('email', input.email);
  require('phone', input.phone);
  require('birthDate', input.birthDate);
  require('birthCity', input.birthCity);
  require('nationality', input.nationality);
  require('address', input.address);
  require('postalCode', input.postalCode);
  require('city', input.city);

  if (input.postalCode?.trim() && !parseFrenchPostalCode(input.postalCode)) {
    missing.push('Code postal valide (5 chiffres)');
  }

  if (
    isFrenchBirthContext({
      birthCountry: input.birthCountry,
      nationality: input.nationality,
    }) &&
    !input.birthDepartment?.trim()
  ) {
    missing.push(PREINSCRIPTION_FIELD_LABELS.birthDepartment);
  }

  if (
    !isFrenchBirthContext({
      birthCountry: input.birthCountry,
      nationality: input.nationality,
    }) &&
    !input.birthCountry?.trim()
  ) {
    missing.push(PREINSCRIPTION_FIELD_LABELS.birthCountry);
  }

  return { complete: missing.length === 0, missing };
}

/** @deprecated Utiliser assessPreinscriptionIdentity pour la landing. */
export function assessCnapsOnboardingIdentity(
  input: Partial<CnapsOnboardingIdentity>,
): { complete: boolean; missing: string[]; missingKeys: CnapsOnboardingFieldKey[] } {
  const pre = assessPreinscriptionIdentity(input);
  return { complete: pre.complete, missing: pre.missing, missingKeys: [] };
}

export type CnapsOnboardingMetadata = {
  cnapsRequestType: CnapsRequestType;
  civility: CnapsOnboardingCivility | null;
  usageName: string | null;
  birthDate: string;
  birthCity: string;
  birthDepartment: string | null;
  birthCountry: string | null;
  birthPlace: string;
  nationality: string;
  country: string;
  address: string;
  postalCode: string;
  city: string;
  identityDocumentType: CnapsIdentityDocumentType | null;
  identityDocumentNumber: string;
  identityDocumentExpiry: string | null;
  housingStatus: CnapsHousingStatus | null;
  frenchLevelProof: string | null;
  residencePermitNumber: string | null;
  residencePermitExpiry: string | null;
  formationSlug?: string;
  fundingMode?: string;
};

export function buildCnapsOnboardingMetadata(input: {
  cnapsRequestType?: CnapsRequestType;
  civility: CnapsOnboardingCivility | null;
  usageName?: string;
  birthDate: string;
  birthCity: string;
  birthDepartment: string | null;
  birthCountry: string | null;
  nationality: string;
  country?: string;
  address: string;
  postalCode: string;
  city: string;
  identityDocumentType?: CnapsIdentityDocumentType | null;
  identityDocumentNumber?: string;
  identityDocumentExpiry?: string;
  housingStatus?: CnapsHousingStatus | null;
  frenchLevelProof?: string;
  residencePermitNumber?: string;
  residencePermitExpiry?: string;
  formationSlug?: string;
  fundingMode?: string;
}): CnapsOnboardingMetadata {
  return {
    cnapsRequestType: input.cnapsRequestType ?? 'PREALABLE',
    civility: input.civility,
    usageName: input.usageName?.trim() || null,
    birthDate: input.birthDate,
    birthCity: input.birthCity,
    birthDepartment: input.birthDepartment,
    birthCountry: input.birthCountry,
    birthPlace: composeBirthPlaceLine(input),
    nationality: input.nationality,
    country: input.country?.trim() || 'France',
    address: input.address,
    postalCode: input.postalCode,
    city: input.city,
    identityDocumentType: input.identityDocumentType ?? null,
    identityDocumentNumber: input.identityDocumentNumber?.trim() || '',
    identityDocumentExpiry: input.identityDocumentExpiry?.trim() || null,
    housingStatus: input.housingStatus ?? null,
    frenchLevelProof: input.frenchLevelProof?.trim() || null,
    residencePermitNumber: input.residencePermitNumber?.trim() || null,
    residencePermitExpiry: input.residencePermitExpiry?.trim() || null,
    formationSlug: input.formationSlug,
    fundingMode: input.fundingMode,
  };
}

export {
  CNAPS_HOUSING_STATUS_LABELS,
  CNAPS_IDENTITY_DOCUMENT_LABELS,
  CNAPS_REQUEST_TYPE_LABELS,
};

export type { CnapsHousingStatus, CnapsIdentityDocumentType, CnapsRequestType };
