import type { LmsContentReviewStatus } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { instructorDisplayName } from '@/lib/lms/instructor-display-name';
import { isLmsContentReviewRequired } from '@/lib/portal/lms-content-review';
export type PendingLmsContentRow = {
  id: string;
  kind: 'chapter' | 'activity';
  title: string;
  courseTitle: string;
  formationName: string | null;
  submittedForReviewAt: string;
  instructorName: string | null;
};

export async function listPendingLmsContent(): Promise<PendingLmsContentRow[]> {
  const [chapters, activities] = await Promise.all([
    prisma.chapter.findMany({
      where: { reviewStatus: 'PENDING_REVIEW' },
      orderBy: { submittedForReviewAt: 'asc' },
      select: {
        id: true,
        title: true,
        submittedForReviewAt: true,
        course: {
          select: {
            title: true,
            formationCatalog: { select: { name: true } },
          },
        },
        reviewedBy: { select: { name: true, firstName: true, lastName: true } },
      },
    }),
    prisma.activity.findMany({
      where: { reviewStatus: 'PENDING_REVIEW' },
      orderBy: { submittedForReviewAt: 'asc' },
      select: {
        id: true,
        name: true,
        submittedForReviewAt: true,
        lastModifiedBy: { select: { name: true, firstName: true, lastName: true } },
        chapter: {
          select: {
            course: {
              select: {
                title: true,
                formationCatalog: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const rows: PendingLmsContentRow[] = [];

  for (const ch of chapters) {
    if (!ch.submittedForReviewAt) continue;
    rows.push({
      id: ch.id,
      kind: 'chapter',
      title: ch.title,
      courseTitle: ch.course.title,
      formationName: ch.course.formationCatalog?.name ? ch.course.formationCatalog.name : null,
      submittedForReviewAt: ch.submittedForReviewAt.toISOString(),
      instructorName: null,
    });
  }

  for (const act of activities) {
    if (!act.submittedForReviewAt) continue;
    const mod = act.lastModifiedBy;
    rows.push({
      id: act.id,
      kind: 'activity',
      title: act.name,
      courseTitle: act.chapter.course.title,
      formationName: act.chapter.course.formationCatalog?.name
        ? act.chapter.course.formationCatalog.name
        : null,
      submittedForReviewAt: act.submittedForReviewAt.toISOString(),
      instructorName: instructorDisplayName(mod),
    });
  }

  return rows.sort(
    (a, b) => new Date(a.submittedForReviewAt).getTime() - new Date(b.submittedForReviewAt).getTime(),
  );
}

export async function reviewLmsContent(
  kind: 'chapter' | 'activity',
  id: string,
  reviewerId: string,
  decision: 'APPROVED' | 'REJECTED',
  reviewNote?: string | null,
) {
  const now = new Date();
  const data = {
    reviewStatus: decision as LmsContentReviewStatus,
    reviewedAt: now,
    reviewedById: reviewerId,
    reviewNote: reviewNote?.trim() ? reviewNote.trim() : null,
    ...(decision === 'APPROVED' ? { isPublished: true } : { isPublished: false }),
  };

  if (kind === 'chapter') {
    return prisma.chapter.update({ where: { id }, data });
  }
  return prisma.activity.update({ where: { id }, data });
}

export function resolveInstructorPublishState(wantsPublished: boolean): {
  isPublished: boolean;
  reviewStatus: LmsContentReviewStatus;
  submittedForReviewAt: Date | null;
} {
  if (!wantsPublished) {
    return { isPublished: false, reviewStatus: 'DRAFT', submittedForReviewAt: null };
  }
  if (isLmsContentReviewRequired()) {
    return {
      isPublished: false,
      reviewStatus: 'PENDING_REVIEW',
      submittedForReviewAt: new Date(),
    };
  }
  return { isPublished: true, reviewStatus: 'APPROVED', submittedForReviewAt: null };
}
