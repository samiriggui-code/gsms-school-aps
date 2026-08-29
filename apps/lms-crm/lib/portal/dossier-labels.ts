import { CandidatureSource, CandidatureStatus, FinanceDevisStatus } from '@repo/database';

export const CANDIDATURE_SOURCE_LABEL_FR: Record<CandidatureSource, string> = {
  [CandidatureSource.MANUAL]: 'Saisie école',
  [CandidatureSource.LEAD]: 'Demande de contact',
  [CandidatureSource.LANDING_SESSION]: 'Préinscription en ligne',
};

export const FINANCE_DEVIS_STATUS_LABEL_FR: Record<FinanceDevisStatus, string> = {
  [FinanceDevisStatus.DRAFT]: 'Brouillon',
  [FinanceDevisStatus.SENT]: 'Envoyé',
  [FinanceDevisStatus.VIEWED]: 'Consulté',
  [FinanceDevisStatus.ACCEPTED]: 'Accepté',
  [FinanceDevisStatus.REJECTED]: 'Refusé',
  [FinanceDevisStatus.EXPIRED]: 'Expiré',
};

export const ENROLLMENT_STATUS_LABEL_FR: Record<string, string> = {
  CONFIRMED: 'Confirmée',
  WAITLIST: 'Liste d’attente',
  CANCELLED: 'Annulée',
};

export const EXAM_OUTCOME_LABEL_FR: Record<string, string> = {
  PENDING: 'En attente',
  PASSED: 'Réussi',
  FAILED: 'Échoué',
  ABSENT: 'Absent',
};

export const CANDIDATURE_STATUS_LABEL_FR: Record<CandidatureStatus, string> = {
  [CandidatureStatus.DRAFT]: 'Prospect — dossier en cours',
  [CandidatureStatus.SUBMITTED]: 'Dossier transmis',
  [CandidatureStatus.MISSING_DOCUMENTS]: 'Pièces manquantes',
  [CandidatureStatus.VALIDATION_PENDING]: 'Validation en cours',
  [CandidatureStatus.PENDING_CNAPS]: 'CNAPS en cours',
  [CandidatureStatus.CNAPS_APPROVED]: 'CNAPS favorable',
  [CandidatureStatus.CNAPS_REJECTED]: 'CNAPS refusé',
  [CandidatureStatus.VALIDATED]: 'Stagiaire — dossier validé',
  [CandidatureStatus.COMPLETED]: 'Diplômé',
  [CandidatureStatus.REJECTED]: 'Dossier refusé',
  [CandidatureStatus.ARCHIVED]: 'Archivé',
};

export const PARCOURS_STEPS = [
  { key: 'inscription', label: 'Inscription', statuses: [CandidatureStatus.DRAFT] },
  {
    key: 'dossier',
    label: 'Dépôt du dossier',
    statuses: [
      CandidatureStatus.SUBMITTED,
      CandidatureStatus.MISSING_DOCUMENTS,
      CandidatureStatus.VALIDATION_PENDING,
    ],
  },
  {
    key: 'cnaps',
    label: 'Attente CNAPS',
    statuses: [CandidatureStatus.PENDING_CNAPS, CandidatureStatus.CNAPS_APPROVED],
  },
  {
    key: 'stagiaire',
    label: 'Formation',
    statuses: [CandidatureStatus.VALIDATED],
  },
  {
    key: 'diplome',
    label: 'Diplômé',
    statuses: [CandidatureStatus.COMPLETED],
  },
] as const;

export function parcoursStepIndex(status: CandidatureStatus | null | undefined): number {
  if (!status) return 0;
  const idx = PARCOURS_STEPS.findIndex((s) =>
    (s.statuses as readonly CandidatureStatus[]).includes(status),
  );
  if (idx >= 0) return idx;
  if (status === CandidatureStatus.CNAPS_REJECTED || status === CandidatureStatus.REJECTED) {
    return 1;
  }
  return 0;
}
