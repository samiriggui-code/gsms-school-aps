import { preinscriptionMessages } from '@/i18n/landing-content/preinscription';

export const SUIVI_FUNDING_MODE_KEYS = [
  'cpf',
  'transition',
  'opco',
  'franceTravail',
  'selfFunded',
  'apprenticeship',
  'discuss',
] as const;

export type SuiviFundingModeKey = (typeof SUIVI_FUNDING_MODE_KEYS)[number];

const LABELS_FR = preinscriptionMessages.fr.landing.preinscription.funding;

export function isSuiviFundingModeKey(value: string | null | undefined): value is SuiviFundingModeKey {
  if (!value) return false;
  return (SUIVI_FUNDING_MODE_KEYS as readonly string[]).includes(value);
}

export function suiviFundingModeLabel(mode: string | null | undefined): string {
  if (!mode?.trim()) return 'Non renseigné';
  if (isSuiviFundingModeKey(mode)) return LABELS_FR[mode];
  return mode.trim();
}

export const SUIVI_FUNDING_MODE_OPTIONS = SUIVI_FUNDING_MODE_KEYS.map((key) => ({
  value: key,
  label: LABELS_FR[key],
}));
