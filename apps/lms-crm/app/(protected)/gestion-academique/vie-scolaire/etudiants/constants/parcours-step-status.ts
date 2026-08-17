export type ParcoursStepStatus = 'pending' | 'in_progress' | 'done' | 'skipped' | 'blocked';

export const PARCOURS_STEP_STATUS_LABEL_FR: Record<ParcoursStepStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  done: 'Terminé',
  skipped: 'Non concerné',
  blocked: 'Bloqué',
};

export function parcoursStepStatusLabel(status: string): string {
  return PARCOURS_STEP_STATUS_LABEL_FR[status as ParcoursStepStatus] ?? status.replace(/_/g, ' ');
}

export function parcoursStepStatusBadgeVariant(
  status: string,
): 'success' | 'primary' | 'secondary' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'done':
      return 'success';
    case 'in_progress':
      return 'primary';
    case 'blocked':
      return 'destructive';
    case 'skipped':
      return 'secondary';
    default:
      return 'outline';
  }
}
