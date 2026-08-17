/** Modes financeurs normalisés pour n8n (Switch workflow Finance). */
export const N8N_FUNDING_MODES = [
  'CPF',
  'OPCO',
  'ENTREPRISE',
  'PARTICULIER',
  'FRANCE_TRAVAIL',
] as const;

export type N8nFundingMode = (typeof N8N_FUNDING_MODES)[number];

function asRecord(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

/** Extrait le mode brut (landing / devis / participant) depuis candidature. */
export function extractFundingModeFromCandidature(
  notes: string | null | undefined,
  metadata: unknown,
): string | null {
  const meta = asRecord(metadata);
  const direct = typeof meta.fundingMode === 'string' ? meta.fundingMode.trim() : '';
  if (direct) return direct;

  const onboarding = asRecord(meta.onboarding);
  const fromOnboarding =
    typeof onboarding.fundingMode === 'string' ? onboarding.fundingMode.trim() : '';
  if (fromOnboarding) return fromOnboarding;

  if (!notes) return null;
  const match = notes.match(/Mode de financement souhaité:\s*(.+)/i);
  return match?.[1]?.trim() ?? null;
}

/** Mappe toute valeur CRM/landing vers le switch n8n. */
export function normalizeFundingModeForN8n(raw: string | null | undefined): N8nFundingMode {
  if (!raw?.trim()) return 'PARTICULIER';

  const upper = raw.trim().toUpperCase();
  if ((N8N_FUNDING_MODES as readonly string[]).includes(upper)) {
    return upper as N8nFundingMode;
  }

  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '');

  const map: Record<string, N8nFundingMode> = {
    cpf: 'CPF',
    transition: 'CPF',
    opco: 'OPCO',
    francetravail: 'FRANCE_TRAVAIL',
    france_travail: 'FRANCE_TRAVAIL',
    poleemploi: 'FRANCE_TRAVAIL',
    apprenticeship: 'FRANCE_TRAVAIL',
    selffunded: 'PARTICULIER',
    particulier: 'PARTICULIER',
    autre: 'PARTICULIER',
    discuss: 'PARTICULIER',
    budget_entreprise: 'ENTREPRISE',
    budgetentreprise: 'ENTREPRISE',
    entreprise: 'ENTREPRISE',
    multi: 'ENTREPRISE',
  };

  return map[key] ?? 'PARTICULIER';
}

export function resolveParticipantFundingModeForN8n(input: {
  participantFundingMode?: string | null;
  candidatureNotes?: string | null;
  candidatureMetadata?: unknown;
}): N8nFundingMode {
  const raw =
    input.participantFundingMode?.trim() ||
    extractFundingModeFromCandidature(
      input.candidatureNotes ?? null,
      input.candidatureMetadata,
    );
  return normalizeFundingModeForN8n(raw);
}
