/**
 * WF-14 — J-5 préparation pédagogique (distinct de WF-03).
 * Pas de nouveau questionnaire : rappel horaires/matériel + relance positionnement incomplet + alerte adaptation PENDING.
 */

import type { NextRequest } from 'next/server';
import type { PrismaClient } from '@repo/database';
import { isEmailConfigured, sendJ5PrepReminderEmail } from '@repo/mail';
import { sendAssessmentInvite } from '@/lib/of/candidature-assessment-service';
import { notifyDisabilityReferentOfAdaptation } from '@/lib/of/candidature-adaptation';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

function dayBoundsUtc(ref: Date, offsetDays: number): { from: Date; to: Date } {
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + offsetDays));
  const from = new Date(d);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(d);
  to.setUTCHours(23, 59, 59, 999);
  return { from, to };
}

function formatFrDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' });
}

export type J5PrepResult = {
  sessionsConsidered: number;
  remindersSent: number;
  positioningRelanced: number;
  adaptationReminded: number;
  skipped: number;
};

export async function processJ5PrepReminders(
  prisma: PrismaClient,
  request: Pick<NextRequest, 'headers'>,
  ref: Date = new Date(),
): Promise<J5PrepResult> {
  const { from, to } = dayBoundsUtc(ref, 5);
  const sessions = await prisma.formationSession.findMany({
    where: {
      startDate: { gte: from, lte: to },
      readinessStatus: { not: 'ARCHIVED' },
    },
    select: {
      id: true,
      startDate: true,
      dateDisplayLabel: true,
      formation: { select: { name: true } },
      participants: {
        where: {
          enrollmentStatus: 'CONFIRMED',
          j5PrepReminderSentAt: null,
        },
        select: {
          id: true,
          candidatureId: true,
          user: { select: { email: true, name: true, firstName: true, lastName: true, id: true } },
        },
      },
    },
    take: 40,
  });

  let remindersSent = 0;
  let positioningRelanced = 0;
  let adaptationReminded = 0;
  let skipped = 0;
  const mailOk = isEmailConfigured();

  for (const session of sessions) {
    for (const participant of session.participants) {
      const email = participant.user.email?.trim();
      if (!email || !mailOk || !session.startDate) {
        skipped += 1;
        continue;
      }

      const learnerName =
        participant.user.name?.trim() ||
        [participant.user.firstName, participant.user.lastName].filter(Boolean).join(' ').trim() ||
        'Stagiaire';

      let positioningUrl: string | null = null;
      let adaptationPending = false;
      let needsAssessmentId: string | null = null;

      if (participant.candidatureId) {
        const assessments = await prisma.candidatureAssessment.findMany({
          where: { candidatureId: participant.candidatureId },
          select: {
            id: true,
            kind: true,
            status: true,
            adaptationStatus: true,
          },
        });
        const positioning = assessments.find((a) => a.kind === 'POSITIONING');
        if (positioning && positioning.status !== 'COMPLETED') {
          const invite = await sendAssessmentInvite(prisma, positioning.id, request);
          if (invite.sent && invite.assessmentUrl) {
            positioningUrl = invite.assessmentUrl;
            positioningRelanced += 1;
          }
        }
        const needs = assessments.find((a) => a.kind === 'NEEDS_ANALYSIS');
        if (needs?.adaptationStatus === 'ADAPTATION_PENDING') {
          adaptationPending = true;
          needsAssessmentId = needs.id;
        }
      }

      await sendJ5PrepReminderEmail({
        to: email,
        learnerName,
        formationName: session.formation.name,
        sessionLabel: session.dateDisplayLabel ?? formatFrDate(session.startDate),
        startDateLabel: formatFrDate(session.startDate),
        positioningUrl,
        adaptationPending,
      });

      if (needsAssessmentId) {
        const n = await notifyDisabilityReferentOfAdaptation(prisma, needsAssessmentId);
        if (n.notified) adaptationReminded += 1;
      }

      await prisma.formationSessionParticipant.update({
        where: { id: participant.id },
        data: { j5PrepReminderSentAt: new Date() },
      });

      await recordStatusEvidence(prisma, {
        category: 'session_prep',
        sourceType: 'LOG',
        sourceId: participant.id,
        eventName: 'PREFORMATION_J5_REMINDER',
        toStatus: 'SENT',
        sessionId: session.id,
        learnerUserId: participant.user.id,
        metadata: {
          candidatureId: participant.candidatureId,
          positioningRelanced: Boolean(positioningUrl),
          adaptationPending,
        },
      });

      remindersSent += 1;
    }
  }

  return {
    sessionsConsidered: sessions.length,
    remindersSent,
    positioningRelanced,
    adaptationReminded,
    skipped,
  };
}
