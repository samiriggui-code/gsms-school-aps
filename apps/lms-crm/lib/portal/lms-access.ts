import type { CandidatureStatus } from '@repo/database';
import type { LmsAccessTier } from './lms-access-shared';

export type { LmsAccessTier } from './lms-access-shared';
export { lmsAccessLabel } from './lms-access-shared';

const FULL_STATUSES: CandidatureStatus[] = ['VALIDATED', 'COMPLETED'];

const PRE_CNAPS_STATUSES: CandidatureStatus[] = [
  'SUBMITTED',
  'MISSING_DOCUMENTS',
  'VALIDATION_PENDING',
  'PENDING_CNAPS',
  'CNAPS_APPROVED',
];

export type LmsLearnerAccess = {
  tier: LmsAccessTier;
  /** Date de début de session (cohorte) — débloque les UV payantes à partir de ce jour. */
  sessionStartsAt: Date | null;
};

export function getLmsAccessTier(status: CandidatureStatus | null | undefined): LmsAccessTier {
  if (!status) return 'none';
  if (FULL_STATUSES.includes(status)) return 'full';
  if (PRE_CNAPS_STATUSES.includes(status)) return 'pre_cnaps';
  return 'none';
}

export function resolveSessionStartsAt(
  interestedStart: Date | string | null | undefined,
  enrolledStarts: Array<Date | string | null | undefined>,
): Date | null {
  const dates: Date[] = [];
  if (interestedStart) dates.push(new Date(interestedStart));
  for (const d of enrolledStarts) {
    if (d) dates.push(new Date(d));
  }
  if (dates.length === 0) return null;
  return dates.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

export function canAccessChapter(
  access: LmsLearnerAccess,
  chapter: { isPublished: boolean; isFree: boolean; position?: number },
  now: Date = new Date(),
): boolean {
  if (!chapter.isPublished) return false;
  if (access.tier === 'none') return false;

  if (chapter.isFree) return true;

  if (access.tier !== 'full') return false;

  if (access.sessionStartsAt && now < access.sessionStartsAt) return false;

  return true;
}

export function chapterLockReason(
  access: LmsLearnerAccess,
  chapter: { isPublished: boolean; isFree: boolean },
  now: Date = new Date(),
): string | null {
  if (!chapter.isPublished) return 'Leçon non publiée.';
  if (access.tier === 'none') return 'Complétez votre dossier pour accéder au parcours.';
  if (!chapter.isFree && access.tier !== 'full') {
    return 'Validation CNAPS requise pour débloquer cette UV.';
  }
  if (!chapter.isFree && access.tier === 'full' && access.sessionStartsAt && now < access.sessionStartsAt) {
    return `Session à partir du ${access.sessionStartsAt.toLocaleDateString('fr-FR')} — contenu bientôt disponible.`;
  }
  return null;
}

export function buildLearnerAccess(
  tier: LmsAccessTier,
  sessionStartsAt: Date | null,
): LmsLearnerAccess {
  return { tier, sessionStartsAt };
}

export function canAccessQuiz(
  chapter: { isPublished: boolean; isFree: boolean; position: number },
  ctx: {
    chapterAccessible: boolean;
    chapterCompleted: boolean;
    previousChapterCompleted: boolean;
    previousQuizPassed: boolean;
  },
): { unlocked: boolean; reason: string | null } {
  if (!ctx.chapterAccessible) {
    return { unlocked: false, reason: 'Module non accessible pour le moment.' };
  }
  if (chapter.isFree || chapter.position <= 1) {
    return { unlocked: true, reason: null };
  }
  if (ctx.previousQuizPassed || ctx.previousChapterCompleted || ctx.chapterCompleted) {
    return { unlocked: true, reason: null };
  }
  return {
    unlocked: false,
    reason: 'Terminez la leçon ou le quiz de l’UV précédente pour débloquer.',
  };
}
