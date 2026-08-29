import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { verifyCandidatureAssessmentPublicToken } from '@/lib/of/candidature-assessment-public-token';
import { questionsForAssessmentKind } from '@/lib/of/candidature-assessment-template';
import {
  CandidatureAssessmentValidationError,
  submitAssessmentAnswers,
} from '@/lib/of/candidature-assessment-service';

type Ctx = { params: Promise<{ assessmentId: string }> };

function verifyGate(request: NextRequest, assessmentId: string) {
  const token = request.nextUrl.searchParams.get('t')?.trim() || '';
  if (!token) return { ok: false as const, message: 'Jeton manquant.', status: 401 };
  const verified = verifyCandidatureAssessmentPublicToken(token);
  if (!verified || verified.assessmentId !== assessmentId) {
    return { ok: false as const, message: 'Jeton invalide ou expiré.', status: 401 };
  }
  return { ok: true as const, token };
}

export async function GET(request: NextRequest, context: Ctx) {
  const { assessmentId } = await context.params;
  const gate = verifyGate(request, assessmentId);
  if (!gate.ok) return fail(gate.message, gate.status);

  const row = await prisma.candidatureAssessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      kind: true,
      status: true,
      candidature: {
        select: {
          formation: { select: { name: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!row) return fail('Questionnaire introuvable.', 404);

  return ok({
    kind: row.kind,
    questions: questionsForAssessmentKind(row.kind),
    formationName: row.candidature.formation?.name ?? null,
    alreadyCompleted: row.status === 'COMPLETED',
  });
}

export async function POST(request: NextRequest, context: Ctx) {
  const { assessmentId } = await context.params;
  const gate = verifyGate(request, assessmentId);
  if (!gate.ok) return fail(gate.message, gate.status);

  let body: { answers?: unknown } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as { answers?: unknown };
  } catch {
    /* optional */
  }
  const answers =
    body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
      ? (body.answers as Record<string, string>)
      : {};

  try {
    const result = await submitAssessmentAnswers(prisma, assessmentId, answers, request);
    return ok(result);
  } catch (e) {
    if (e instanceof CandidatureAssessmentValidationError) {
      return fail(e.message, 422);
    }
    console.error('[assessment public submit]', e);
    return fail('Soumission impossible.', 500, e);
  }
}
