/**
 * WF-24 — proposition de rattrapage examen (FAILED uniquement).
 * Le résultat du rattrapage se réenregistre via `recordExamOutcome` / PATCH examens existant.
 */

import type { PrismaClient } from '@repo/database';
import { isEmailConfigured, sendExamRetakeProposedEmail } from '@repo/mail';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

export class ExamRetakeError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'NOT_FAILED' | 'INVALID_DATE',
  ) {
    super(message);
  }
}

function formatFrDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export type ProposeExamRetakeResult = {
  participantId: string;
  retakeDate: string;
  emailSent: boolean;
  fundingCaseNoted: boolean;
};

export async function proposeExamRetake(
  prisma: PrismaClient,
  participantId: string,
  retakeDate: Date,
  notes?: string | null,
): Promise<ProposeExamRetakeResult> {
  if (Number.isNaN(retakeDate.getTime())) {
    throw new ExamRetakeError('retakeDate invalide.', 'INVALID_DATE');
  }

  const row = await prisma.formationSessionParticipant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      examOutcome: true,
      sessionId: true,
      userId: true,
      user: { select: { email: true, name: true, firstName: true, lastName: true } },
      session: {
        select: {
          dateDisplayLabel: true,
          formation: { select: { name: true } },
        },
      },
      fundingCases: { select: { id: true }, take: 1 },
    },
  });
  if (!row) throw new ExamRetakeError('Participant introuvable.', 'NOT_FOUND');
  if (row.examOutcome !== 'FAILED') {
    throw new ExamRetakeError(
      'Un rattrapage ne peut être proposé que si le résultat est FAILED.',
      'NOT_FAILED',
    );
  }

  const noteText = typeof notes === 'string' ? notes.trim() || null : null;
  const updated = await prisma.formationSessionParticipant.update({
    where: { id: participantId },
    data: {
      retakeDate,
      retakeNotes: noteText,
    },
    select: { id: true, retakeDate: true },
  });

  const learnerName =
    row.user.name?.trim() ||
    [row.user.firstName, row.user.lastName].filter(Boolean).join(' ').trim() ||
    'Stagiaire';
  const formationName = row.session.formation.name;
  const sessionLabel = row.session.dateDisplayLabel ?? 'Session';
  const retakeDateLabel = formatFrDate(retakeDate);

  let emailSent = false;
  const email = row.user.email?.trim();
  if (email && isEmailConfigured()) {
    await sendExamRetakeProposedEmail({
      to: email,
      learnerName,
      formationName,
      sessionLabel,
      retakeDateLabel,
      notes: noteText,
    });
    emailSent = true;
  }

  const fundingCaseNoted = row.fundingCases.length > 0;
  await recordStatusEvidence(prisma, {
    category: 'session_exam',
    sourceType: 'LOG',
    sourceId: participantId,
    eventName: 'EXAM_RETAKE_PROPOSED',
    fromStatus: 'FAILED',
    toStatus: 'RETAKE_PROPOSED',
    sessionId: row.sessionId,
    learnerUserId: row.userId,
    metadata: {
      retakeDate: updated.retakeDate?.toISOString() ?? null,
      notes: noteText,
      fundingCasePresent: fundingCaseNoted,
      emailSent,
      // Pas d'e-mail financeur en P0 (adresse non fiable) — Evidence visible dossier.
    },
  });

  return {
    participantId: updated.id,
    retakeDate: updated.retakeDate!.toISOString(),
    emailSent,
    fundingCaseNoted,
  };
}
