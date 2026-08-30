/**
 * WF-21 — évaluations formatives présentiel (pas de pont LMS).
 */

import type { PrismaClient } from '@repo/database';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

export type CreateFormativeAssessmentInput = {
  participantId: string;
  label: string;
  score?: number | null;
  passed?: boolean | null;
  feedback?: string | null;
  sessionDayId?: string | null;
  recordedById?: string | null;
};

export async function listFormativeAssessments(prisma: PrismaClient, participantId: string) {
  return prisma.formativeAssessment.findMany({
    where: { participantId },
    orderBy: { createdAt: 'desc' },
    include: {
      recordedBy: { select: { id: true, name: true, email: true } },
      sessionDay: { select: { id: true, dayDate: true } },
    },
  });
}

export async function createFormativeAssessment(
  prisma: PrismaClient,
  input: CreateFormativeAssessmentInput,
) {
  const participant = await prisma.formationSessionParticipant.findUnique({
    where: { id: input.participantId },
    select: { id: true, sessionId: true, userId: true },
  });
  if (!participant) throw new Error('PARTICIPANT_NOT_FOUND');

  const label = input.label.trim();
  if (!label) throw new Error('LABEL_REQUIRED');

  if (input.sessionDayId) {
    const day = await prisma.formationSessionDay.findFirst({
      where: { id: input.sessionDayId, sessionId: participant.sessionId },
      select: { id: true },
    });
    if (!day) throw new Error('SESSION_DAY_NOT_FOUND');
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.formativeAssessment.create({
      data: {
        participantId: input.participantId,
        label,
        score: input.score ?? null,
        passed: input.passed ?? null,
        feedback: input.feedback?.trim() || null,
        sessionDayId: input.sessionDayId ?? null,
        recordedById: input.recordedById ?? null,
      },
    });
    await recordStatusEvidence(tx, {
      category: 'session_formative',
      sourceType: 'EVALUATION',
      sourceId: created.id,
      eventName: 'FORMATIVE_ASSESSMENT_RECORDED',
      toStatus: created.passed === true ? 'PASSED' : created.passed === false ? 'FAILED' : 'RECORDED',
      sessionId: participant.sessionId,
      learnerUserId: participant.userId,
      metadata: {
        participantId: participant.id,
        label: created.label,
        score: created.score,
        passed: created.passed,
      },
    });
    return created;
  });

  return row;
}
