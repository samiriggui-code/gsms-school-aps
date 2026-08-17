/** Sans dépendance Prisma/pg — importable depuis les composants `use client`. */

export type LmsAccessTier = 'none' | 'pre_cnaps' | 'full';

const FULL_STATUSES = new Set(['VALIDATED', 'COMPLETED']);
const PRE_CNAPS_STATUSES = new Set([
  'SUBMITTED',
  'MISSING_DOCUMENTS',
  'VALIDATION_PENDING',
  'PENDING_CNAPS',
  'CNAPS_APPROVED',
]);

export function getLmsAccessTier(status: string | null | undefined): LmsAccessTier {
  if (!status) return 'none';
  if (FULL_STATUSES.has(status)) return 'full';
  if (PRE_CNAPS_STATUSES.has(status)) return 'pre_cnaps';
  return 'none';
}

export function lmsAccessLabel(tier: LmsAccessTier): string {
  switch (tier) {
    case 'full':
      return 'Accès complet';
    case 'pre_cnaps':
      return 'Modules préparatoires (CNAPS en cours)';
    default:
      return 'Accès limité — complétez votre dossier';
  }
}

/** Libellé court pour badges CRM / liste candidats. */
export function lmsAccessShortLabel(tier: LmsAccessTier): string {
  switch (tier) {
    case 'full':
      return 'E-formation complète';
    case 'pre_cnaps':
      return 'E-formation limitée';
    default:
      return 'Pas d\'accès LMS';
  }
}

export function lmsAccessBadgeVariant(
  tier: LmsAccessTier,
): 'success' | 'warning' | 'secondary' {
  switch (tier) {
    case 'full':
      return 'success';
    case 'pre_cnaps':
      return 'warning';
    default:
      return 'secondary';
  }
}
