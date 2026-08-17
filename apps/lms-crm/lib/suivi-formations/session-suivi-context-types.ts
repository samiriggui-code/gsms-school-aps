import type { SuiviSessionPhase } from '@/lib/suivi-formations/session-progress';

export type { SuiviSessionPhase };

export type SuiviSessionContext = {
  id: string;
  formationName: string;
  formationSlug: string;
  formationDuration: string | null;
  dateDisplayLabel: string;
  sessionSubtitle: string | null;
  sessionKind: string;
  locationDisplay: string;
  startDate: string | null;
  endDate: string | null;
  registrationClosesAt: string | null;
  examDate: string | null;
  traineesMin: number | null;
  traineesMax: number | null;
  participantCount: number;
  trainerName: string | null;
  trainerEmail: string | null;
  trainerAvatar: string | null;
  venueRoom: {
    id: string;
    name: string;
    shortCode: string | null;
    imageUrl: string | null;
    capacity: number | null;
    floorLabel: string | null;
  } | null;
  phase: SuiviSessionPhase;
};

export const SUIVI_SESSION_KIND_LABELS: Record<string, string> = {
  INITIAL: 'Session initiale',
  WITH_EXAM: 'Avec examen final',
  OTHER: 'Session',
};
