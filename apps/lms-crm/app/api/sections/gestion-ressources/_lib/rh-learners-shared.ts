import { CandidatureStatus, Prisma } from '@repo/database';

export const HUB_DOSSIER_LABEL_FR: Partial<Record<string, string>> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
  PENDING_CNAPS: 'Attente CNAPS',
  CNAPS_APPROVED: 'CNAPS favorable',
  CNAPS_REJECTED: 'CNAPS refus',
  VALIDATED: 'Dossier validé',
  COMPLETED: 'Terminé',
  REJECTED: 'Refusé',
  ARCHIVED: 'Archivé',
};

export function candidatHubLifecycleWhere(lifecycleRaw: string | null): Prisma.UserWhereInput {
  const lifecycle = (lifecycleRaw || 'all').trim();
  const terminal = [
    CandidatureStatus.VALIDATED,
    CandidatureStatus.COMPLETED,
    CandidatureStatus.ARCHIVED,
    CandidatureStatus.REJECTED,
  ];

  if (lifecycle === 'session_inscrit') {
    return { formationSessionParticipants: { some: {} } };
  }
  if (lifecycle === 'dossier_valide') {
    return { candidatures: { some: { status: CandidatureStatus.VALIDATED } } };
  }
  if (lifecycle === 'dossier_en_attente') {
    return { candidatures: { some: { status: { notIn: terminal } } } };
  }
  if (lifecycle === 'sans_dossier') {
    return { candidatures: { none: {} } };
  }
  return {};
}

export function mapFormEtudiantUserCategory(v: string): 'INTERNAL' | 'CLIENT' | 'SUBCONTRACTOR' {
  if (v === 'CLIENT') return 'CLIENT';
  if (v === 'SUBCONTRACTOR' || v === 'Etudiant') return 'SUBCONTRACTOR';
  return 'INTERNAL';
}

export type LearnerRoleSlug = 'eleve' | 'candidat';

export function parseLearnerRoleSlug(param: string | null): LearnerRoleSlug {
  return param === 'candidat' ? 'candidat' : 'eleve';
}

export function getLearnerScopedWhere(
  roleSlug: LearnerRoleSlug = 'eleve',
  extra: Prisma.UserWhereInput = {},
): Prisma.UserWhereInput {
  return {
    isTrashed: false,
    role: { slug: roleSlug, isTrashed: false },
    ...extra,
  };
}

export function parseOptDateInput(input: string): Date | undefined {
  if (!input?.trim()) return undefined;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function toMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
