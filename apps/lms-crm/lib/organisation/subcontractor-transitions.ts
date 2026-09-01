import { SubcontractorQualificationStatus } from '@repo/database/browser';

/** WF-39 transitions staff (happy path + branches). */
const ALLOWED: Partial<
  Record<SubcontractorQualificationStatus, SubcontractorQualificationStatus[]>
> = {
  [SubcontractorQualificationStatus.PENDING_VALIDATION]: [
    SubcontractorQualificationStatus.APPROVED,
    SubcontractorQualificationStatus.SUSPENDED,
  ],
  [SubcontractorQualificationStatus.APPROVED]: [
    SubcontractorQualificationStatus.ACTIVE,
    SubcontractorQualificationStatus.REVIEW_REQUIRED,
    SubcontractorQualificationStatus.SUSPENDED,
  ],
  [SubcontractorQualificationStatus.ACTIVE]: [
    SubcontractorQualificationStatus.REVIEW_REQUIRED,
    SubcontractorQualificationStatus.SUSPENDED,
  ],
  [SubcontractorQualificationStatus.REVIEW_REQUIRED]: [
    SubcontractorQualificationStatus.ACTIVE,
    SubcontractorQualificationStatus.APPROVED,
    SubcontractorQualificationStatus.SUSPENDED,
  ],
  [SubcontractorQualificationStatus.SUSPENDED]: [
    SubcontractorQualificationStatus.PENDING_VALIDATION,
    SubcontractorQualificationStatus.REVIEW_REQUIRED,
  ],
};

export function canSetSubcontractorStatus(
  from: SubcontractorQualificationStatus,
  to: SubcontractorQualificationStatus,
): boolean {
  if (from === to) return true;
  return (ALLOWED[from] ?? []).includes(to);
}

export function subcontractorStatusActions(
  current: SubcontractorQualificationStatus,
): SubcontractorQualificationStatus[] {
  return ALLOWED[current] ?? [];
}
