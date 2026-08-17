import type { SuiviEmargementStatus } from '@/app/(protected)/gestion-academique/vie-scolaire/suivi-formations/types/suivi-formations-api';
import { SUIVI_EMARGEMENT_STATUS_LABELS } from '@/app/(protected)/gestion-academique/vie-scolaire/suivi-formations/types/suivi-formations-api';

export type EmargementReportBrand = {
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  qualiopiLogoUrl?: string | null;
  addressLine?: string;
  legalLine?: string;
  contactLine?: string;
};

export type EmargementReportParticipant = {
  index: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  statusLabel?: string | null;
};

/** Payload unique — aperçu HTML et génération PDF. */
export type EmargementReportData = {
  brand?: EmargementReportBrand | null;
  formationName: string;
  sessionLabel: string;
  sessionSubtitle?: string | null;
  location: string;
  roomFloor?: string | null;
  trainerName: string;
  trainerEmail?: string | null;
  attendanceDate: string;
  slotLabel: string;
  formationDuration?: string | null;
  participantCount?: number;
  capacityLabel?: string | null;
  sessionStartLabel?: string | null;
  sessionEndLabel?: string | null;
  journalNotes?: string | null;
  participants: EmargementReportParticipant[];
};

export function formatEmargementDateFr(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatEmargementShortDateFr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function emargementStatusLabel(status: SuiviEmargementStatus | string | null | undefined): string {
  if (!status) return '—';
  return SUIVI_EMARGEMENT_STATUS_LABELS[status as SuiviEmargementStatus] ?? status;
}

export function buildCapacityLabel(traineesMin: number | null, traineesMax: number | null): string | null {
  if (traineesMin == null && traineesMax == null) return null;
  if (traineesMin != null && traineesMax != null) return `Capacité ${traineesMin}–${traineesMax}`;
  if (traineesMax != null) return `Capacité max. ${traineesMax}`;
  return `Capacité min. ${traineesMin}`;
}
