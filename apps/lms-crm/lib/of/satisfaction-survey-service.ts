import type { NextRequest } from 'next/server';
import type { PrismaClient } from '@repo/database';
import { isEmailConfigured, sendSatisfactionSurveyInviteEmail } from '@repo/mail';
import { signSatisfactionSurveyPublicToken } from '@/lib/of/satisfaction-survey-public-token';
import { absolutePublicSatisfactionSurveyUrl } from '@/lib/of/satisfaction-survey-public-url';
import { questionsForSurveyTiming } from '@/lib/of/satisfaction-survey-template';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

/** Durée de validité du lien public — assez large pour couvrir l'enquête à froid (J+45). */
const SURVEY_LINK_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function participantDisplayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    'Participant'
  );
}

export type EnsureSurveysForSessionResult = {
  participantsCount: number;
  createdHotIds: string[];
  createdColdIds: string[];
};

/**
 * Crée (idempotent, via la contrainte unique) une ligne HOT + une ligne COLD par participant
 * confirmé de la session, si elles n'existent pas déjà.
 */
export async function ensureSurveysForSession(
  prisma: PrismaClient,
  sessionId: string,
): Promise<EnsureSurveysForSessionResult> {
  const participants = await prisma.formationSessionParticipant.findMany({
    where: { sessionId, enrollmentStatus: 'CONFIRMED' },
    select: { id: true },
  });

  const createdHotIds: string[] = [];
  const createdColdIds: string[] = [];

  for (const participant of participants) {
    for (const timing of ['HOT', 'COLD'] as const) {
      const existing = await prisma.satisfactionSurvey.findUnique({
        where: {
          sessionId_participantId_timing: { sessionId, participantId: participant.id, timing },
        },
        select: { id: true },
      });
      if (existing) continue;

      const created = await prisma.satisfactionSurvey.create({
        data: { sessionId, participantId: participant.id, timing },
        select: { id: true },
      });
      if (timing === 'HOT') createdHotIds.push(created.id);
      else createdColdIds.push(created.id);
    }
  }

  return { participantsCount: participants.length, createdHotIds, createdColdIds };
}

export type SendSurveyInviteResult = {
  sent: boolean;
  skippedReason?: string;
  surveyUrl?: string;
};

/** Signe le lien public, envoie l'invitation par e-mail et passe l'enquête au statut SENT. */
export async function sendSurveyInvite(
  prisma: PrismaClient,
  surveyId: string,
  request: Pick<NextRequest, 'headers'>,
): Promise<SendSurveyInviteResult> {
  const survey = await prisma.satisfactionSurvey.findUnique({
    where: { id: surveyId },
    include: {
      participant: {
        include: { user: { select: { name: true, firstName: true, lastName: true, email: true } } },
      },
      session: { include: { formation: { select: { name: true } } } },
    },
  });
  if (!survey) throw new Error('Enquête introuvable.');

  if (survey.status === 'COMPLETED') {
    return { sent: false, skippedReason: 'Le stagiaire a déjà répondu à cette enquête.' };
  }

  const email = survey.participant.user.email?.trim();
  if (!email) {
    return { sent: false, skippedReason: 'Participant sans adresse e-mail.' };
  }
  if (!isEmailConfigured()) {
    return { sent: false, skippedReason: 'Canal e-mail non configuré (RESEND_API_KEY ou SMTP_HOST).' };
  }

  const token = signSatisfactionSurveyPublicToken(surveyId, Date.now() + SURVEY_LINK_TTL_MS);
  const surveyUrl = absolutePublicSatisfactionSurveyUrl(request, surveyId, token);

  try {
    await sendSatisfactionSurveyInviteEmail({
      recipientName: participantDisplayName(survey.participant.user),
      recipientEmail: email,
      formationName: survey.session.formation.name,
      sessionLabel: survey.session.dateDisplayLabel,
      surveyUrl,
      timing: survey.timing === 'COLD' ? 'cold' : 'hot',
    });
  } catch (e) {
    console.error('[satisfaction-survey] envoi invitation', e);
    return { sent: false, skippedReason: 'Échec d’envoi de l’e-mail.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.satisfactionSurvey.update({
      where: { id: surveyId },
      data: { status: 'SENT', sentAt: new Date() },
    });
    await recordStatusEvidence(tx, {
      category: 'satisfaction_survey',
      sourceType: 'QUESTIONNAIRE',
      sourceId: surveyId,
      eventName: 'SATISFACTION_REQUESTED',
      fromStatus: survey.status,
      toStatus: 'SENT',
      sessionId: survey.sessionId,
      learnerUserId: survey.participant.userId,
      metadata: { timing: survey.timing },
    });
  });

  return { sent: true, surveyUrl };
}

export class SatisfactionSurveyValidationError extends Error {}

export type SubmitSurveyAnswersResult = { alreadyCompleted: boolean };

/** Valide les réponses requises pour le timing de l'enquête puis persiste et clôture. */
export async function submitSurveyAnswers(
  prisma: PrismaClient,
  surveyId: string,
  answers: Record<string, string>,
): Promise<SubmitSurveyAnswersResult> {
  const survey = await prisma.satisfactionSurvey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      timing: true,
      status: true,
      sessionId: true,
      participant: { select: { userId: true } },
    },
  });
  if (!survey) throw new Error('Enquête introuvable.');

  if (survey.status === 'COMPLETED') {
    return { alreadyCompleted: true };
  }

  const questions = questionsForSurveyTiming(survey.timing);
  const missing = questions.filter((q) => q.required && !answers[q.code]?.toString().trim());
  if (missing.length > 0) {
    throw new SatisfactionSurveyValidationError(
      `Réponses manquantes : ${missing.map((q) => q.label).join(', ')}.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.satisfactionSurvey.update({
      where: { id: surveyId },
      data: { answers, status: 'COMPLETED', respondedAt: new Date() },
    });
    await recordStatusEvidence(tx, {
      category: 'satisfaction_survey',
      sourceType: 'QUESTIONNAIRE',
      sourceId: surveyId,
      eventName: 'SATISFACTION_COMPLETED',
      fromStatus: survey.status,
      toStatus: 'COMPLETED',
      sessionId: survey.sessionId,
      learnerUserId: survey.participant.userId,
      metadata: { timing: survey.timing },
    });
  });

  return { alreadyCompleted: false };
}
