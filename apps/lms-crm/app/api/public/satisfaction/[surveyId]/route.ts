import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { verifySatisfactionSurveyTokenForSurvey } from '@/lib/of/satisfaction-survey-public-request';
import {
  SATISFACTION_SCALE,
  questionsForSurveyTiming,
} from '@/lib/of/satisfaction-survey-template';
import { SatisfactionSurveyValidationError, submitSurveyAnswers } from '@/lib/of/satisfaction-survey-service';

type Ctx = { params: Promise<{ surveyId: string }> };

/** Repères (formation, session) + questions du bon timing pour la page publique d'enquête. */
export async function GET(request: NextRequest, context: Ctx) {
  const { surveyId } = await context.params;
  const gate = verifySatisfactionSurveyTokenForSurvey(request, surveyId);
  if (!gate.ok) return fail(gate.message, gate.status);

  const survey = await prisma.satisfactionSurvey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      timing: true,
      status: true,
      session: { select: { dateDisplayLabel: true, formation: { select: { name: true } } } },
    },
  });
  if (!survey) return fail('Enquête introuvable.', 404);

  return ok({
    timing: survey.timing,
    questions: questionsForSurveyTiming(survey.timing),
    scale: SATISFACTION_SCALE,
    formationName: survey.session.formation.name,
    sessionLabel: survey.session.dateDisplayLabel,
    alreadyCompleted: survey.status === 'COMPLETED',
  });
}

/** Soumission des réponses par le stagiaire (lien public signé). */
export async function POST(request: NextRequest, context: Ctx) {
  const { surveyId } = await context.params;
  const gate = verifySatisfactionSurveyTokenForSurvey(request, surveyId);
  if (!gate.ok) return fail(gate.message, gate.status);

  let body: { answers?: unknown } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as { answers?: unknown };
  } catch {
    /* corps optionnel */
  }

  const answers =
    body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
      ? (body.answers as Record<string, string>)
      : {};

  try {
    const result = await submitSurveyAnswers(prisma, surveyId, answers);
    if (result.alreadyCompleted) {
      return ok({ completed: true, already: true }, 200);
    }
    return ok({ completed: true, already: false });
  } catch (e) {
    if (e instanceof SatisfactionSurveyValidationError) {
      return fail(e.message, 422);
    }
    console.error('[satisfaction public submit]', e);
    return fail('Soumission impossible.', 500, e);
  }
}
