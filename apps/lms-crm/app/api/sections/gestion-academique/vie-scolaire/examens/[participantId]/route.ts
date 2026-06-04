import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamOutcome } from '@repo/database';
import { recordExamOutcome } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ participantId: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { participantId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const outcomeRaw = body.examOutcome ?? body.outcome;
  if (!outcomeRaw || !(Object.values(FormationExamOutcome) as string[]).includes(outcomeRaw)) {
    return fail('examOutcome invalide (PENDING, PASSED, FAILED, ABSENT).', 400);
  }

  const examDate =
    body.examDate && typeof body.examDate === 'string'
      ? new Date(body.examDate)
      : undefined;

  try {
    const row = await prisma.$transaction((tx) =>
      recordExamOutcome(tx, participantId, outcomeRaw as FormationExamOutcome, examDate),
    );
    return ok({ participant: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    if (msg === 'PARTICIPANT_NOT_FOUND') return fail('Inscription session introuvable.', 404);
    console.error('[examens PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}
