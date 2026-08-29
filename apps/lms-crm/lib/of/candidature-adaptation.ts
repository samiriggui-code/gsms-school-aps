/**
 * WF-04 — cycle accessibilité candidat (sur `CandidatureAssessment`).
 */

import type { AdaptationStatus, PrismaClient } from '@repo/database';
import { AdaptationStatus as AdaptationStatusEnum } from '@repo/database';
import { isEmailConfigured, sendAdaptationRequiredStaffEmail } from '@repo/mail';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

const FORWARD: Record<AdaptationStatus, AdaptationStatus | null> = {
  NO_ADAPTATION_REQUIRED: null,
  ADAPTATION_PENDING: 'ADAPTATION_APPROVED',
  ADAPTATION_APPROVED: 'ADAPTATION_IMPLEMENTED',
  ADAPTATION_IMPLEMENTED: null,
};

export function canAdvanceAdaptation(
  from: AdaptationStatus | null | undefined,
  to: AdaptationStatus,
): boolean {
  if (!from) return false;
  return FORWARD[from] === to;
}

export async function notifyDisabilityReferentOfAdaptation(
  prisma: PrismaClient,
  assessmentId: string,
): Promise<{ notified: boolean; skippedReason?: string }> {
  const row = await prisma.candidatureAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      candidature: {
        include: {
          user: { select: { email: true, name: true, firstName: true, lastName: true } },
          formation: { select: { name: true } },
        },
      },
    },
  });
  if (!row) return { notified: false, skippedReason: 'Assessment introuvable.' };

  const settings = await prisma.systemSetting.findFirst({
    where: { active: true },
    select: {
      disabilityReferentName: true,
      disabilityReferentEmail: true,
    },
    orderBy: { id: 'asc' },
  });
  const to = settings?.disabilityReferentEmail?.trim();
  if (!to) return { notified: false, skippedReason: 'Référent handicap sans e-mail.' };
  if (!isEmailConfigured()) {
    return { notified: false, skippedReason: 'Canal e-mail non configuré.' };
  }

  const learnerName =
    row.candidature.user.name?.trim() ||
    [row.candidature.user.firstName, row.candidature.user.lastName].filter(Boolean).join(' ').trim() ||
    'Candidat';
  const detailRaw =
    row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers)
      ? (row.answers as Record<string, unknown>)['NA-ADAPTATION-DETAIL']
      : null;
  const detail = typeof detailRaw === 'string' ? detailRaw.trim() : '';

  await sendAdaptationRequiredStaffEmail({
    to,
    referentName: settings?.disabilityReferentName?.trim() || 'Référent handicap',
    learnerName,
    learnerEmail: row.candidature.user.email?.trim() || null,
    formationName: row.candidature.formation?.name ?? 'Formation',
    detail: detail || null,
    candidatureId: row.candidatureId,
  });

  await prisma.candidatureAssessment.update({
    where: { id: assessmentId },
    data: { adaptationNotifiedAt: new Date() },
  });

  return { notified: true };
}

export async function advanceAdaptationStatus(
  prisma: PrismaClient,
  assessmentId: string,
  nextStatus: AdaptationStatus,
  notes?: string | null,
): Promise<{ id: string; adaptationStatus: AdaptationStatus | null }> {
  const row = await prisma.candidatureAssessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      adaptationStatus: true,
      candidatureId: true,
      candidature: { select: { userId: true } },
    },
  });
  if (!row) throw new Error('Assessment introuvable.');
  if (!canAdvanceAdaptation(row.adaptationStatus, nextStatus)) {
    throw new AdaptationAdvanceError(
      `Transition adaptation invalide : ${row.adaptationStatus ?? 'null'} → ${nextStatus}.`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.candidatureAssessment.update({
      where: { id: assessmentId },
      data: {
        adaptationStatus: nextStatus,
        ...(typeof notes === 'string' ? { adaptationNotes: notes.trim() || null } : {}),
      },
      select: { id: true, adaptationStatus: true },
    });
    await recordStatusEvidence(tx, {
      category: 'candidature_assessment',
      sourceType: 'LOG',
      sourceId: assessmentId,
      eventName: 'ADAPTATION_STATUS_CHANGED',
      fromStatus: row.adaptationStatus,
      toStatus: nextStatus,
      learnerUserId: row.candidature.userId,
      indicatorCodes:
        nextStatus === AdaptationStatusEnum.ADAPTATION_IMPLEMENTED ? ['Q-I20', 'Q-I26'] : undefined,
      metadata: { candidatureId: row.candidatureId },
    });
    return next;
  });

  return updated;
}

export class AdaptationAdvanceError extends Error {}
