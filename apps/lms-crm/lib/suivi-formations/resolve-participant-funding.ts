import { extractFundingModeFromCandidature } from '@/lib/portal/dossier-formation-sheet';
import { suiviFundingModeLabel } from '@/lib/suivi-formations/funding-modes';

export type ResolvedParticipantFunding = {
  fundingMode: string | null;
  fundingReference: string | null;
  fundingNotes: string | null;
  fundingModeLabel: string;
  source: 'participant' | 'candidature' | null;
};

type ParticipantFundingRow = {
  fundingMode: string | null;
  fundingReference: string | null;
  fundingNotes: string | null;
  candidature: {
    notes: string | null;
    metadata: unknown;
  } | null;
};

export function resolveParticipantFunding(row: ParticipantFundingRow): ResolvedParticipantFunding {
  if (row.fundingMode?.trim()) {
    return {
      fundingMode: row.fundingMode.trim(),
      fundingReference: row.fundingReference?.trim() || null,
      fundingNotes: row.fundingNotes?.trim() || null,
      fundingModeLabel: suiviFundingModeLabel(row.fundingMode),
      source: 'participant',
    };
  }

  const fromCandidature = row.candidature
    ? extractFundingModeFromCandidature(row.candidature.notes, row.candidature.metadata)
    : null;

  if (fromCandidature) {
    return {
      fundingMode: fromCandidature,
      fundingReference: null,
      fundingNotes: null,
      fundingModeLabel: suiviFundingModeLabel(fromCandidature),
      source: 'candidature',
    };
  }

  return {
    fundingMode: null,
    fundingReference: null,
    fundingNotes: null,
    fundingModeLabel: 'Non renseigné',
    source: null,
  };
}
