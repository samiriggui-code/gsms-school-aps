import { formatPortalDate } from '@/lib/portal/format-portal-date';

export type FormationPortalDisplayMeta = {
  /** Note sur 5 (ex. 4,5) */
  ratingScore: number | null;
  ratingCount: number | null;
  /** Stagiaires / participants formés */
  participantCount: number;
  authorLabel: string | null;
  lastUpdatedLabel: string | null;
  languageLabel: string;
  theoryPracticeLabel: string | null;
};

function asRecord(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function formatMonthYear(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${y}`;
}

function satisfactionToRating(satisfactionPercent: number | null | undefined): number | null {
  if (satisfactionPercent == null || !Number.isFinite(satisfactionPercent)) return null;
  const clamped = Math.min(100, Math.max(0, satisfactionPercent));
  return Math.round((clamped / 100) * 5 * 10) / 10;
}

export function buildFormationPortalDisplayMeta(input: {
  providerName: string | null;
  instructorName: string | null;
  clientSatisfactionRate: number | null;
  theoryPercent: number | null;
  practicePercent: number | null;
  updatedAt: Date;
  complementaryDetails: unknown;
  participantCount: number;
}): FormationPortalDisplayMeta {
  const details = asRecord(input.complementaryDetails);
  const portal = asRecord(details.portalDisplay);

  const ratingFromDb =
    typeof portal.ratingScore === 'number'
      ? portal.ratingScore
      : typeof portal.ratingScore === 'string'
        ? Number.parseFloat(portal.ratingScore)
        : null;

  const ratingCountFromDb =
    typeof portal.ratingCount === 'number'
      ? portal.ratingCount
      : typeof portal.ratingCount === 'string'
        ? Number.parseInt(portal.ratingCount, 10)
        : null;

  const alumniFromDb =
    typeof portal.alumniCount === 'number'
      ? portal.alumniCount
      : typeof portal.alumniCount === 'string'
        ? Number.parseInt(portal.alumniCount, 10)
        : null;

  const languageLabel =
    typeof portal.language === 'string' && portal.language.trim()
      ? portal.language.trim()
      : 'Français';

  const satisfaction =
    input.clientSatisfactionRate != null ? Number(input.clientSatisfactionRate) : null;

  const theory = input.theoryPercent;
  const practice = input.practicePercent;
  const theoryPracticeLabel =
    theory != null && practice != null ? `${theory}% théorique / ${practice}% pratique` : null;

  return {
    ratingScore:
      ratingFromDb != null && Number.isFinite(ratingFromDb)
        ? ratingFromDb
        : satisfactionToRating(satisfaction),
    ratingCount:
      ratingCountFromDb != null && Number.isFinite(ratingCountFromDb)
        ? ratingCountFromDb
        : input.participantCount > 0
          ? input.participantCount
          : null,
    participantCount: alumniFromDb ?? input.participantCount,
    authorLabel:
      (typeof portal.authorLabel === 'string' && portal.authorLabel.trim()) ||
      input.instructorName ||
      input.providerName ||
      null,
    lastUpdatedLabel: formatMonthYear(input.updatedAt),
    languageLabel,
    theoryPracticeLabel,
  };
}

export function formatRatingScore(score: number | null): string {
  if (score == null || !Number.isFinite(score)) return '—';
  return score.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatParticipantCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '—';
  return count.toLocaleString('fr-FR');
}

/** Affichage long pour tooltip / accessibilité */
export function formatLastUpdatedFull(date: Date): string {
  return formatPortalDate(date.toISOString());
}
