import type { LmsContentReviewStatus } from '@repo/database';

/** Si true, le contenu publié doit être APPROVED par un admin avant visibilité stagiaire. */
export function isLmsContentReviewRequired(): boolean {
  return process.env.LMS_CONTENT_REVIEW_REQUIRED === 'true';
}

export function isLmsContentVisibleToLearner(reviewStatus: LmsContentReviewStatus): boolean {
  if (!isLmsContentReviewRequired()) return true;
  return reviewStatus === 'APPROVED';
}

export function lmsLearnerReviewFilter() {
  if (!isLmsContentReviewRequired()) return {};
  return { reviewStatus: 'APPROVED' as const };
}

export function lmsReviewStatusLabel(status: LmsContentReviewStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Brouillon';
    case 'PENDING_REVIEW':
      return 'En attente validation';
    case 'APPROVED':
      return 'Validé';
    case 'REJECTED':
      return 'Refusé';
    default:
      return status;
  }
}
