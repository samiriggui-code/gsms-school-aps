import { FundingCaseStatus } from '@repo/database';

/**
 * Happy-path suivant (G5 transitions). Branches APPROVED / PARTIALLY_APPROVED
 * convergent vers SERVICE_IN_PROGRESS ; REJECTED → CLOSED.
 * CANCELLED / CLOSED = terminaux (pas de next).
 */
export const FUNDING_CASE_NEXT_STATUS: Partial<
  Record<FundingCaseStatus, FundingCaseStatus>
> = {
  [FundingCaseStatus.DRAFT]: FundingCaseStatus.DOCUMENTS_REQUIRED,
  [FundingCaseStatus.DOCUMENTS_REQUIRED]: FundingCaseStatus.READY_TO_SUBMIT,
  [FundingCaseStatus.READY_TO_SUBMIT]: FundingCaseStatus.SUBMITTED,
  [FundingCaseStatus.SUBMITTED]: FundingCaseStatus.PENDING,
  [FundingCaseStatus.PENDING]: FundingCaseStatus.APPROVED,
  [FundingCaseStatus.APPROVED]: FundingCaseStatus.SERVICE_IN_PROGRESS,
  [FundingCaseStatus.PARTIALLY_APPROVED]: FundingCaseStatus.SERVICE_IN_PROGRESS,
  [FundingCaseStatus.REJECTED]: FundingCaseStatus.CLOSED,
  [FundingCaseStatus.SERVICE_IN_PROGRESS]: FundingCaseStatus.SERVICE_COMPLETED,
  [FundingCaseStatus.SERVICE_COMPLETED]: FundingCaseStatus.JUSTIFICATION_REQUIRED,
  [FundingCaseStatus.JUSTIFICATION_REQUIRED]: FundingCaseStatus.READY_TO_INVOICE,
  [FundingCaseStatus.READY_TO_INVOICE]: FundingCaseStatus.INVOICED,
  [FundingCaseStatus.INVOICED]: FundingCaseStatus.PAYMENT_PENDING,
  [FundingCaseStatus.PAYMENT_PENDING]: FundingCaseStatus.PAID,
  [FundingCaseStatus.PAID]: FundingCaseStatus.CLOSED,
};

export function nextFundingCaseStatus(
  current: FundingCaseStatus,
): FundingCaseStatus | null {
  return FUNDING_CASE_NEXT_STATUS[current] ?? null;
}

export function canCancelFundingCase(status: FundingCaseStatus): boolean {
  return (
    status !== FundingCaseStatus.CLOSED && status !== FundingCaseStatus.CANCELLED
  );
}
