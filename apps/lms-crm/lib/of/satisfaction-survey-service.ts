import type { NextRequest } from 'next/server';
import type { PrismaClient, SatisfactionSurveyTiming } from '@repo/database';
import { isEmailConfigured, sendSatisfactionSurveyInviteEmail } from '@repo/mail';
import { signSatisfactionSurveyPublicToken } from '@/lib/of/satisfaction-survey-public-token';
import { absolutePublicSatisfactionSurveyUrl } from '@/lib/of/satisfaction-survey-public-url';
import {
  SATISFACTION_ALERT_THRESHOLD,
  audienceKeyForTiming,
  averageScaleScore,
  isStakeholderSurveyTiming,
  questionsForSurveyTiming,
} from '@/lib/of/satisfaction-survey-template';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

/** Durée de validité du lien public — assez large pour couvrir l'enquête à froid (J+45). */
const SURVEY_LINK_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const STAKEHOLDER_TIMINGS = ['COMPANY', 'TRAINER', 'FUNDER'] as const;

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

function mailTimingBucket(
  timing: SatisfactionSurveyTiming,
): 'hot' | 'cold' | 'company' | 'trainer' | 'funder' {
  switch (timing) {
    case 'COLD':
      return 'cold';
    case 'COMPANY':
      return 'company';
    case 'TRAINER':
      return 'trainer';
    case 'FUNDER':
      return 'funder';
    case 'HOT':
      return 'hot';
    default: {
      const _exhaustive: never = timing;
      return _exhaustive;
    }
  }
}

export type EnsureSurveysForSessionResult = {
  participantsCount: number;
  createdHotIds: string[];
  createdColdIds: string[];
  createdStakeholderIds: string[];
};

type Recipient = { email: string | null; name: string };

async function resolveStakeholderRecipient(
  prisma: PrismaClient,
  sessionId: string,
  timing: 'COMPANY' | 'TRAINER' | 'FUNDER',
): Promise<Recipient> {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      trainerUserId: true,
      trainer: { select: { name: true, firstName: true, lastName: true, email: true } },
      formationId: true,
    },
  });
  if (!session) return { email: null, name: timing };

  if (timing === 'TRAINER') {
    const t = session.trainer;
    if (!t) return { email: null, name: 'Formateur' };
    return {
      email: t.email?.trim() || null,
      name: participantDisplayName(t),
    };
  }

  if (timing === 'COMPANY') {
    const tr = await prisma.trainingRequest.findFirst({
      where: { formationId: session.formationId, companyId: { not: null } },
      orderBy: { updatedAt: 'desc' },
      select: {
        company: {
          select: {
            name: true,
            email: true,
            contacts: {
              orderBy: { updatedAt: 'desc' },
              take: 1,
              select: { email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
    const company = tr?.company;
    if (!company) return { email: null, name: 'Entreprise' };
    const contact = company.contacts[0];
    const email = contact?.email?.trim() || company.email?.trim() || null;
    const name =
      [contact?.firstName, contact?.lastName].filter(Boolean).join(' ').trim() ||
      company.name ||
      'Entreprise';
    return { email, name };
  }

  // FUNDER
  const funding = await prisma.fundingCase.findFirst({
    where: { sessionId },
    orderBy: { updatedAt: 'desc' },
    select: {
      funderType: true,
      provider: { select: { label: true, code: true } },
      learnerUser: { select: { email: true, name: true, firstName: true, lastName: true } },
    },
  });
  if (!funding) return { email: null, name: 'Financeur' };
  // Pas d'e-mail financeur fiable en P0 — on crée la ligne ; envoi skip tant que recipientEmail vide.
  return {
    email: null,
    name: funding.provider.label || funding.provider.code || funding.funderType,
  };
}

/**
 * Crée (idempotent) HOT + COLD par participant confirmé, et COMPANY/TRAINER/FUNDER
 * (une ligne par session) si destinataire résolvable ou ligne placeholder.
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
  const createdStakeholderIds: string[] = [];

  for (const participant of participants) {
    for (const timing of ['HOT', 'COLD'] as const) {
      const audienceKey = audienceKeyForTiming(timing, participant.id);
      const existing = await prisma.satisfactionSurvey.findUnique({
        where: {
          sessionId_timing_audienceKey: { sessionId, timing, audienceKey },
        },
        select: { id: true },
      });
      if (existing) continue;

      const created = await prisma.satisfactionSurvey.create({
        data: {
          sessionId,
          participantId: participant.id,
          audienceKey,
          timing,
        },
        select: { id: true },
      });
      if (timing === 'HOT') createdHotIds.push(created.id);
      else createdColdIds.push(created.id);
    }
  }

  for (const timing of STAKEHOLDER_TIMINGS) {
    const audienceKey = audienceKeyForTiming(timing);
    const existing = await prisma.satisfactionSurvey.findUnique({
      where: {
        sessionId_timing_audienceKey: { sessionId, timing, audienceKey },
      },
      select: { id: true },
    });
    if (existing) continue;

    const recipient = await resolveStakeholderRecipient(prisma, sessionId, timing);
    const created = await prisma.satisfactionSurvey.create({
      data: {
        sessionId,
        participantId: null,
        audienceKey,
        timing,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
      },
      select: { id: true },
    });
    createdStakeholderIds.push(created.id);
  }

  return {
    participantsCount: participants.length,
    createdHotIds,
    createdColdIds,
    createdStakeholderIds,
  };
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
      session: {
        include: {
          formation: { select: { name: true } },
        },
        // trainerUserId is a scalar on FormationSession — available on survey.session
      },
    },
  });
  if (!survey) throw new Error('Enquête introuvable.');

  if (survey.status === 'COMPLETED') {
    return { sent: false, skippedReason: 'Réponse déjà enregistrée pour cette enquête.' };
  }

  const recipientName = isStakeholderSurveyTiming(survey.timing)
    ? survey.recipientName?.trim() || survey.timing
    : survey.participant
      ? participantDisplayName(survey.participant.user)
      : 'Destinataire';

  const email = isStakeholderSurveyTiming(survey.timing)
    ? survey.recipientEmail?.trim()
    : survey.participant?.user.email?.trim();

  if (!email) {
    return {
      sent: false,
      skippedReason: isStakeholderSurveyTiming(survey.timing)
        ? 'Destinataire stakeholder sans e-mail (renseigner recipientEmail).'
        : 'Participant sans adresse e-mail.',
    };
  }
  if (!isEmailConfigured()) {
    return { sent: false, skippedReason: 'Canal e-mail non configuré (RESEND_API_KEY ou SMTP_HOST).' };
  }

  const token = signSatisfactionSurveyPublicToken(surveyId, Date.now() + SURVEY_LINK_TTL_MS);
  const surveyUrl = absolutePublicSatisfactionSurveyUrl(request, surveyId, token);

  try {
    await sendSatisfactionSurveyInviteEmail({
      recipientName,
      recipientEmail: email,
      formationName: survey.session.formation.name,
      sessionLabel: survey.session.dateDisplayLabel,
      surveyUrl,
      timing: mailTimingBucket(survey.timing),
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
      learnerUserId: survey.participant?.userId ?? null,
      metadata: {
        timing: survey.timing,
        audienceKey: survey.audienceKey,
        trainerUserId: survey.session.trainerUserId,
      },
    });
  });

  return { sent: true, surveyUrl };
}

export class SatisfactionSurveyValidationError extends Error {}

export type SubmitSurveyAnswersResult = { alreadyCompleted: boolean; scoreAverage: number | null; scoreAlert: boolean };

/** Valide les réponses, calcule le score WF-32, persiste et clôture (+ Evidence si alerte). */
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
      audienceKey: true,
      participant: { select: { userId: true } },
      session: { select: { trainerUserId: true } },
    },
  });
  if (!survey) throw new Error('Enquête introuvable.');

  if (survey.status === 'COMPLETED') {
    return { alreadyCompleted: true, scoreAverage: null, scoreAlert: false };
  }

  const questions = questionsForSurveyTiming(survey.timing);
  const missing = questions.filter((q) => q.required && !answers[q.code]?.toString().trim());
  if (missing.length > 0) {
    throw new SatisfactionSurveyValidationError(
      `Réponses manquantes : ${missing.map((q) => q.label).join(', ')}.`,
    );
  }

  const scoreAverage = averageScaleScore(survey.timing, answers);
  const scoreAlert =
    scoreAverage != null && scoreAverage < SATISFACTION_ALERT_THRESHOLD;

  await prisma.$transaction(async (tx) => {
    await tx.satisfactionSurvey.update({
      where: { id: surveyId },
      data: {
        answers,
        status: 'COMPLETED',
        respondedAt: new Date(),
        scoreAverage,
        scoreAlert,
      },
    });
    await recordStatusEvidence(tx, {
      category: 'satisfaction_survey',
      sourceType: 'QUESTIONNAIRE',
      sourceId: surveyId,
      eventName: 'SATISFACTION_COMPLETED',
      fromStatus: survey.status,
      toStatus: 'COMPLETED',
      sessionId: survey.sessionId,
      learnerUserId: survey.participant?.userId ?? null,
      metadata: {
        timing: survey.timing,
        audienceKey: survey.audienceKey,
        scoreAverage,
        scoreAlert,
        alertThreshold: SATISFACTION_ALERT_THRESHOLD,
        trainerUserId: survey.session.trainerUserId,
      },
    });
    if (scoreAlert) {
      await recordStatusEvidence(tx, {
        category: 'satisfaction_survey',
        sourceType: 'LOG',
        sourceId: surveyId,
        eventName: 'SATISFACTION_SCORE_ALERT',
        fromStatus: null,
        toStatus: 'ALERT',
        sessionId: survey.sessionId,
        learnerUserId: survey.participant?.userId ?? null,
        metadata: {
          timing: survey.timing,
          scoreAverage,
          threshold: SATISFACTION_ALERT_THRESHOLD,
          trainerUserId: survey.session.trainerUserId,
        },
      });
    }
  });

  return { alreadyCompleted: false, scoreAverage, scoreAlert };
}
