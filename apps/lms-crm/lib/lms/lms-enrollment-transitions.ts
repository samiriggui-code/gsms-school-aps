import { EnrollmentStatus } from '@repo/database';

/** Transitions staff CRM pour Enrollment LMS (G12). */
const ALLOWED: Partial<Record<EnrollmentStatus, EnrollmentStatus[]>> = {
  [EnrollmentStatus.PENDING]: [
    EnrollmentStatus.VALIDATED,
    EnrollmentStatus.REJECTED,
    EnrollmentStatus.ARCHIVED,
  ],
  [EnrollmentStatus.VALIDATED]: [
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.ARCHIVED,
    EnrollmentStatus.REJECTED,
  ],
  [EnrollmentStatus.REJECTED]: [EnrollmentStatus.PENDING, EnrollmentStatus.ARCHIVED],
  [EnrollmentStatus.COMPLETED]: [EnrollmentStatus.ARCHIVED],
  [EnrollmentStatus.ARCHIVED]: [EnrollmentStatus.PENDING],
};

export function canSetLmsEnrollmentStatus(
  from: EnrollmentStatus,
  to: EnrollmentStatus,
): boolean {
  if (from === to) return true;
  return (ALLOWED[from] ?? []).includes(to);
}

export function lmsEnrollmentStatusActions(
  current: EnrollmentStatus,
): EnrollmentStatus[] {
  return ALLOWED[current] ?? [];
}
