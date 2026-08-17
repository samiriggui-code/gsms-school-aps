export const FORMATION_EXAM_OUTCOME_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PASSED: 'Réussi',
  FAILED: 'Échec',
  ABSENT: 'Absent',
};

const OUTCOME_I18N_KEYS: Record<string, string> = {
  PENDING: 'vieScolaire.outcomes.PENDING',
  PASSED: 'vieScolaire.outcomes.PASSED',
  FAILED: 'vieScolaire.outcomes.FAILED',
  ABSENT: 'vieScolaire.outcomes.ABSENT',
};

const STATUS_I18N_KEYS: Record<string, string> = {
  PLANNED: 'vieScolaire.examStatus.PLANNED',
  IN_PROGRESS: 'vieScolaire.examStatus.IN_PROGRESS',
  COMPLETED: 'vieScolaire.examStatus.COMPLETED',
  CANCELLED: 'vieScolaire.examStatus.CANCELLED',
};

type TranslateFn = (key: string) => string;

export function formationExamOutcomeLabel(outcome: string): string {
  return FORMATION_EXAM_OUTCOME_LABELS[outcome] ?? outcome;
}

export function formationExamOutcomeLabelI18n(t: TranslateFn, outcome: string): string {
  const key = OUTCOME_I18N_KEYS[outcome];
  if (!key) return formationExamOutcomeLabel(outcome);
  const translated = t(key);
  return translated === key ? formationExamOutcomeLabel(outcome) : translated;
}

export function formationExamStatusLabelI18n(t: TranslateFn, status: string): string {
  const key = STATUS_I18N_KEYS[status];
  if (!key) return formationExamStatusLabel(status);
  const translated = t(key);
  return translated === key ? formationExamStatusLabel(status) : translated;
}

export function formationExamOutcomeBadgeVariant(
  outcome: string,
): 'secondary' | 'success' | 'destructive' | 'warning' {
  if (outcome === 'PASSED') return 'success';
  if (outcome === 'FAILED') return 'destructive';
  if (outcome === 'ABSENT') return 'warning';
  return 'secondary';
}

export const FORMATION_EXAM_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export function formationExamStatusLabel(status: string): string {
  return FORMATION_EXAM_STATUS_LABELS[status] ?? status;
}

export function formationExamStatusBadgeVariant(
  status: string,
): 'secondary' | 'info' | 'success' | 'destructive' {
  if (status === 'IN_PROGRESS') return 'info';
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'destructive';
  return 'secondary';
}
