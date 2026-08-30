/**
 * WF-19 — prévention rupture de parcours (signaux absences / échec sans rattrapage).
 */

import type { DropoutRiskStatus, PrismaClient } from '@repo/database';
import {
  getSupportEmail,
  isEmailConfigured,
  sendDropoutRiskFlaggedEmail,
} from '@repo/mail';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

const FORWARD: Record<DropoutRiskStatus, DropoutRiskStatus | null> = {
  NONE: 'FLAGGED',
  FLAGGED: 'CONTACTED',
  CONTACTED: 'ACTION_PROPOSED',
  ACTION_PROPOSED: 'RESOLVED',
  RESOLVED: null,
};

export class DropoutRiskError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_TRANSITION',
  ) {
    super(message);
  }
}

export function canAdvanceDropoutRisk(
  from: DropoutRiskStatus,
  to: DropoutRiskStatus,
): boolean {
  return FORWARD[from] === to;
}

function displayName(user: {
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email?.trim() ||
    'Contact'
  );
}

/** Cron quotidien — flag FLAGGED si absences injustifiées ≥2 ou FAILED sans retake. */
export async function processDropoutRiskDaily(prisma: PrismaClient): Promise<{
  flagged: number;
  skipped: number;
  notified: number;
}> {
  const candidates = await prisma.formationSessionParticipant.findMany({
    where: {
      enrollmentStatus: 'CONFIRMED',
      dropoutRiskStatus: 'NONE',
      OR: [
        { examOutcome: 'FAILED', retakeDate: null },
        {
          emargements: {
            some: {
              status: 'ABSENT',
              justificationStatus: { in: ['UNJUSTIFIED', 'JUSTIFICATION_REQUESTED'] },
            },
          },
        },
      ],
    },
    take: 100,
    select: {
      id: true,
      sessionId: true,
      userId: true,
      examOutcome: true,
      retakeDate: true,
      user: { select: { name: true, firstName: true, lastName: true, email: true } },
      session: {
        select: {
          dateDisplayLabel: true,
          trainerUserId: true,
          trainer: { select: { email: true, name: true, firstName: true, lastName: true } },
          formation: { select: { name: true } },
        },
      },
      emargements: {
        where: {
          status: 'ABSENT',
          justificationStatus: { in: ['UNJUSTIFIED', 'JUSTIFICATION_REQUESTED'] },
        },
        select: { id: true },
      },
    },
  });

  let flagged = 0;
  let skipped = 0;
  let notified = 0;
  const mailOk = isEmailConfigured();

  for (const row of candidates) {
    const unjustifiedAbsences = row.emargements.length;
    const failedNoRetake = row.examOutcome === 'FAILED' && !row.retakeDate;
    const reasons: string[] = [];
    if (unjustifiedAbsences >= 2) {
      reasons.push(`${unjustifiedAbsences} absences non justifiées`);
    }
    if (failedNoRetake) {
      reasons.push('échec examen sans rattrapage proposé');
    }
    if (reasons.length === 0) {
      skipped += 1;
      continue;
    }

    const reason = reasons.join(' · ');
    await prisma.formationSessionParticipant.update({
      where: { id: row.id },
      data: {
        dropoutRiskStatus: 'FLAGGED',
        dropoutRiskFlaggedAt: new Date(),
        dropoutRiskReason: reason,
      },
    });

    await recordStatusEvidence(prisma, {
      category: 'session_dropout_risk',
      sourceType: 'LOG',
      sourceId: row.id,
      eventName: 'DROPOUT_RISK_FLAGGED',
      fromStatus: 'NONE',
      toStatus: 'FLAGGED',
      sessionId: row.sessionId,
      learnerUserId: row.userId,
      metadata: { reason, unjustifiedAbsences, failedNoRetake },
    });

    flagged += 1;

    if (!mailOk) continue;
    const learnerName = displayName(row.user);
    const formationName = row.session.formation.name;
    const sessionLabel = row.session.dateDisplayLabel ?? 'Session';
    const trainerEmail = row.session.trainer?.email?.trim();
    const staffEmail = getSupportEmail();

    const mailInput = {
      learnerName,
      formationName,
      sessionLabel,
      reason,
    };

    if (trainerEmail) {
      await sendDropoutRiskFlaggedEmail({
        to: trainerEmail,
        recipientName: displayName(row.session.trainer!),
        roleLabel: 'formateur',
        ...mailInput,
      });
      notified += 1;
    }
    if (staffEmail) {
      await sendDropoutRiskFlaggedEmail({
        to: staffEmail,
        recipientName: 'Administration',
        roleLabel: 'administration',
        ...mailInput,
      });
      notified += 1;
    }
  }

  return { flagged, skipped, notified };
}

export async function advanceDropoutRisk(
  prisma: PrismaClient,
  participantId: string,
  nextStatus: DropoutRiskStatus,
  notes?: string | null,
) {
  const row = await prisma.formationSessionParticipant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      dropoutRiskStatus: true,
      sessionId: true,
      userId: true,
    },
  });
  if (!row) throw new DropoutRiskError('Participant introuvable.', 'NOT_FOUND');
  if (!canAdvanceDropoutRisk(row.dropoutRiskStatus, nextStatus)) {
    throw new DropoutRiskError(
      `Transition invalide : ${row.dropoutRiskStatus} → ${nextStatus}.`,
      'INVALID_TRANSITION',
    );
  }

  const noteText = typeof notes === 'string' ? notes.trim() || null : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.formationSessionParticipant.update({
      where: { id: participantId },
      data: {
        dropoutRiskStatus: nextStatus,
        ...(noteText !== undefined ? { dropoutRiskNotes: noteText } : {}),
      },
      select: {
        id: true,
        dropoutRiskStatus: true,
        dropoutRiskReason: true,
        dropoutRiskNotes: true,
        dropoutRiskFlaggedAt: true,
      },
    });
    await recordStatusEvidence(tx, {
      category: 'session_dropout_risk',
      sourceType: 'LOG',
      sourceId: participantId,
      eventName: 'DROPOUT_RISK_STATUS_CHANGED',
      fromStatus: row.dropoutRiskStatus,
      toStatus: nextStatus,
      sessionId: row.sessionId,
      learnerUserId: row.userId,
      metadata: { notes: noteText ?? null },
    });
    return next;
  });

  return updated;
}
