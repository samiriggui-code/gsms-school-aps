/**
 * Cartographie CNAPS fev. 2026 — source de verite onboarding / prefill PDF.
 *
 * PDF officiel (pages utiles) :
 * - p2 : type demande (prealable/provisoire), identite (civilite, nom, nom d'usage), adresse
 * - p3 : autorisation contact + activites + centre de formation (ecole)
 * - p4 : CP / commune ecole
 * - p5 : type formation, libelle, pieces identite / domicile (cases)
 * - p9 : signature / date (manuel)
 *
 * Absent du PDF mais obligatoire dossier / pieces jointes :
 * - prenom, date & lieu naissance, nationalite, type & n° piece identite, situation logement,
 *   niveau francais (etrangers), titre sejour (etrangers).
 */

export type CnapsRequestType = 'PREALABLE' | 'PROVISOIRE';

export type CnapsIdentityDocumentType = 'CNI' | 'PASSPORT' | 'TITRE_SEJOUR' | 'UE_ID';

export type CnapsHousingStatus = 'TENANT' | 'OWNER' | 'HOSTED' | 'OTHER';

/** Champs imprimes sur le PDF officiel (overlay). */
export const CNAPS_PDF_OVERLAY_FIELDS = [
  'cnapsRequestType',
  'civility',
  'lastName',
  'usageName',
  'addressLine',
  'schoolName',
  'schoolSiret',
  'schoolCnapsAuth',
  'schoolAddress',
  'schoolPostalCode',
  'schoolCity',
  'formationLabel',
  'activityCheckboxes',
  'formationTypeCheckbox',
  'authorizeContact',
  'identityCniCheckbox',
] as const;

/** Champs collectes onboarding pour dossier complet (metadata + User). */
export const CNAPS_ONBOARDING_DOSSIER_FIELDS = [
  'cnapsRequestType',
  'civility',
  'firstName',
  'lastName',
  'usageName',
  'email',
  'phone',
  'birthDate',
  'birthCity',
  'birthDepartment',
  'birthCountry',
  'nationality',
  'address',
  'postalCode',
  'city',
  'identityDocumentType',
  'identityDocumentNumber',
  'identityDocumentExpiry',
  'housingStatus',
  'frenchLevelProof',
  'residencePermitNumber',
  'residencePermitExpiry',
] as const;

/** Champs preinscription landing uniquement (identite + adresse). */
export const CNAPS_PREINSCRIPTION_FIELDS = [
  'civility',
  'firstName',
  'lastName',
  'usageName',
  'email',
  'phone',
  'birthDate',
  'birthCity',
  'birthDepartment',
  'birthCountry',
  'nationality',
  'address',
  'postalCode',
  'city',
] as const;

export const CNAPS_REQUEST_TYPE_LABELS: Record<CnapsRequestType, string> = {
  PREALABLE: "Autorisation préalable d'entrée en formation",
  PROVISOIRE: 'Autorisation provisoire',
};

export const CNAPS_IDENTITY_DOCUMENT_LABELS: Record<CnapsIdentityDocumentType, string> = {
  CNI: "Carte nationale d'identité",
  PASSPORT: 'Passeport',
  TITRE_SEJOUR: 'Titre de séjour',
  UE_ID: "Pièce d'identité UE / EEE",
};

export const CNAPS_HOUSING_STATUS_LABELS: Record<CnapsHousingStatus, string> = {
  TENANT: 'Locataire / hébergé avec bail',
  OWNER: 'Propriétaire / à mon nom',
  HOSTED: 'Hébergé (attestation + CNI hébergeur)',
  OTHER: 'Autre situation',
};
