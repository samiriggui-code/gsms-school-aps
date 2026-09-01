import type { FormationDeliveryMode, FundingCaseStatus, FundingFunderType } from '@repo/database';

/** Heures proxy par créneau émargé PRESENT/LATE (matin ou soir). */
export const BPF_HOURS_PER_SLOT = 3.5;

/** Statuts où le montant accordé compte pour le BPF (post-décision financeur). */
export const BPF_APPROVED_STATUSES: FundingCaseStatus[] = [
  'APPROVED',
  'PARTIALLY_APPROVED',
  'SERVICE_IN_PROGRESS',
  'SERVICE_COMPLETED',
  'JUSTIFICATION_REQUIRED',
  'READY_TO_INVOICE',
  'INVOICED',
  'PAYMENT_PENDING',
  'PAID',
  'CLOSED',
];

/** Lignes logiques du cadre C (produits HT par source — Cerfa 10443). */
export const BPF_CADRE_C_LINES = [
  { key: 'entreprises', label: 'Entreprises (plan de développement des compétences)' },
  { key: 'opco', label: 'OPCO' },
  { key: 'cpf', label: 'CPF / Mon Compte Formation' },
  { key: 'pouvoirs_publics', label: 'Pouvoirs publics (État, régions, collectivités…)' },
  { key: 'france_travail', label: 'France Travail' },
  { key: 'particuliers', label: 'Particuliers à leurs frais' },
  { key: 'sous_traitance_recue', label: 'Sous-traitance reçue (autres OF)' },
  { key: 'autres', label: 'Autres produits formation' },
] as const;

export type BpfCadreCKey = (typeof BPF_CADRE_C_LINES)[number]['key'];

/** Publics du cadre F (stagiaires formés directement). */
export const BPF_CADRE_F_AUDIENCES = [
  { key: 'salaries', label: 'Salariés' },
  { key: 'demandeurs_emploi', label: 'Demandeurs d’emploi' },
  { key: 'particuliers', label: 'Particuliers' },
  { key: 'autres', label: 'Autres stagiaires' },
] as const;

export type BpfCadreFAudienceKey = (typeof BPF_CADRE_F_AUDIENCES)[number]['key'];

export function mapFunderTypeToCadreC(funderType: FundingFunderType): BpfCadreCKey {
  switch (funderType) {
    case 'ENTREPRISE':
      return 'entreprises';
    case 'OPCO':
      return 'opco';
    case 'CPF':
      return 'cpf';
    case 'FRANCE_TRAVAIL':
      return 'france_travail';
    case 'REGION':
    case 'AGEFIPH':
    case 'TRANSITIONS_PRO':
      return 'pouvoirs_publics';
    case 'SELF_FUNDED':
      return 'particuliers';
    case 'APPRENTICESHIP':
    case 'OTHER':
      return 'autres';
    default: {
      const _exhaustive: never = funderType;
      return _exhaustive;
    }
  }
}

export function mapAudienceKey(
  funderType: FundingFunderType | null | undefined,
  fundingMode: string | null | undefined,
): BpfCadreFAudienceKey {
  const mode = (fundingMode ?? '').toUpperCase();
  if (mode.includes('OPCO') || mode.includes('ENTREPRISE') || mode.includes('EMPLOYEUR')) {
    return 'salaries';
  }
  if (mode.includes('FRANCE TRAVAIL') || mode.includes('POLE') || mode.includes('FT')) {
    return 'demandeurs_emploi';
  }
  if (mode.includes('CPF') || mode.includes('PARTICULIER') || mode.includes('SELF')) {
    return 'particuliers';
  }

  if (!funderType) return 'autres';
  switch (funderType) {
    case 'ENTREPRISE':
    case 'OPCO':
      return 'salaries';
    case 'FRANCE_TRAVAIL':
    case 'TRANSITIONS_PRO':
      return 'demandeurs_emploi';
    case 'CPF':
    case 'SELF_FUNDED':
      return 'particuliers';
    case 'REGION':
    case 'AGEFIPH':
    case 'APPRENTICESHIP':
    case 'OTHER':
      return 'autres';
    default: {
      const _exhaustive: never = funderType;
      return _exhaustive;
    }
  }
}

export function splitHoursByDeliveryMode(
  hours: number,
  mode: FormationDeliveryMode | null | undefined,
): { presentiel: number; distanciel: number } {
  switch (mode) {
    case 'DISTANCIEL':
      return { presentiel: 0, distanciel: hours };
    case 'MIXTE':
      return {
        presentiel: Math.round(hours * 50) / 100,
        distanciel: Math.round(hours * 50) / 100,
      };
    case 'PRESENTIEL':
    case 'ENTREPRISE_SUR_SITE':
      return { presentiel: hours, distanciel: 0 };
    default:
      return { presentiel: hours, distanciel: 0 };
  }
}
