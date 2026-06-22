export type SuiviSessionPhase = 'upcoming' | 'running' | 'past' | 'unknown';

export type SuiviSessionOption = {
  id: string;
  dateDisplayLabel: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  sessionKind: string;
  participantCount: number;
  phase: SuiviSessionPhase;
  formation: {
    id: string;
    name: string;
    slug: string;
    courseId: string | null;
  };
};

export type SuiviFormationsStatsPayload = {
  sessionId: string;
  sessionLabel: string;
  formationName: string;
  phase: SuiviSessionPhase;
  participantsTotal: number;
  avgProgressPercent: number;
  presentToday: number;
  emargementSlotsCompleted: number;
  emargementSlotsTotal: number;
  avgQuizCompletionPercent: number;
};

export type SuiviStagiaireRow = {
  participantId: string;
  userId: string;
  candidatureId: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  enrollmentStatus: string;
  examOutcome: string;
  fundingMode: string | null;
  fundingReference: string | null;
  fundingNotes: string | null;
  fundingModeLabel: string;
  fundingSource: 'participant' | 'candidature' | null;
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  quizPassed: number;
  quizTotal: number;
  lastActivityAt: string | null;
};

export const SUIVI_SESSION_PHASE_LABELS: Record<SuiviSessionPhase, string> = {
  running: 'En cours',
  upcoming: 'À venir',
  past: 'Terminée',
  unknown: 'Dates à préciser',
};

export const SUIVI_ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmé',
  WAITLIST: 'Liste d’attente',
  CANCELLED: 'Annulé',
};

export const SUIVI_EXAM_OUTCOME_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PASSED: 'Réussi',
  FAILED: 'Échoué',
  ABSENT: 'Absent',
};

export type SuiviJournalDayRow = {
  id: string;
  dayDate: string;
  journalNotesMorning: string | null;
  journalNotesEvening: string | null;
  participantTotal: number;
  morningPresent: number;
  eveningPresent: number;
  morningComplete: boolean;
  eveningComplete: boolean;
  morningPdfAssetId: string | null;
  eveningPdfAssetId: string | null;
};

export type SuiviEmargementStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export const SUIVI_EMARGEMENT_STATUS_LABELS: Record<SuiviEmargementStatus, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  LATE: 'Retard',
  EXCUSED: 'Excusé',
};

export type SuiviDocumentRow = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  category: string;
  categoryLabel: string;
  dayDate: string | null;
  slot: 'MORNING' | 'EVENING' | null;
  createdAt: string;
  createdByName: string | null;
};

export type SuiviPresenceHistoryRow = {
  dayId: string;
  dayDate: string;
  slot: 'MORNING' | 'EVENING';
  status: SuiviEmargementStatus;
  markedAt: string | null;
};

export type SuiviParticipantLearningPayload = {
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  quizPassed: number;
  quizTotal: number;
  lastActivityAt: string | null;
  chapters: Array<{
    chapterId: string;
    title: string;
    position: number;
    completed: boolean;
    completedAt: string | null;
  }>;
  quizzes: Array<{
    activityId: string;
    name: string;
    chapterTitle: string;
    bestScore: number | null;
    passed: boolean;
    attemptCount: number;
    lastAttemptAt: string | null;
  }>;
};

export type SuiviFundingPayload = {
  fundingMode: string | null;
  fundingReference: string | null;
  fundingNotes: string | null;
  fundingModeLabel: string;
  source: 'participant' | 'candidature' | null;
};
