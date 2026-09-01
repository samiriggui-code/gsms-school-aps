import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamOutcome } from '@repo/database';
import { recordExamOutcome, createWorkflowEngine } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ participantId: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

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

    try {
      const detail = await prisma.formationSessionParticipant.findUnique({
        where: { id: participantId },
        select: {
          id: true,
          sessionId: true,
          candidatureId: true,
          userId: true,
          user: { select: { name: true, email: true } },
        },
      });
      if (detail?.candidatureId) {
        const workflows = createWorkflowEngine(prisma);
        await workflows.emit(
          'crm.candidature.exam.recorded',
          {
            participantId: detail.id,
            candidatureId: detail.candidatureId,
            userId: detail.userId,
            candidateName: detail.user.name ?? detail.user.email ?? 'Participant',
            email: detail.user.email ?? null,
            examOutcome: outcomeRaw,
            examDate: row.examDate?.toISOString() ?? null,
          },
          { dedupeKey: `workflow:exam:${participantId}:${outcomeRaw}` },
        );

        if (outcomeRaw === 'PASSED') {
          const attestation = await prisma.formationAttestation.findFirst({
            where: {
              candidatureId: detail.candidatureId,
              sessionId: detail.sessionId,
            },
            select: { id: true, title: true },
            orderBy: { createdAt: 'desc' },
          });
          if (attestation) {
            await workflows.emit(
              'crm.candidature.attestation.issued',
              {
                attestationId: attestation.id,
                candidatureId: detail.candidatureId,
                userId: detail.userId,
                candidateName: detail.user.name ?? detail.user.email ?? 'Participant',
                email: detail.user.email ?? null,
                attestationTitle: attestation.title,
                sessionId: detail.sessionId,
                autoIssuedOnExam: true,
              },
              { dedupeKey: `workflow:attestation:${attestation.id}` },
            );
          }
        }
      }
    } catch (e) {
      console.error('[examens] workflow', e);
    }

    return ok({ participant: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    if (msg === 'PARTICIPANT_NOT_FOUND') return fail('Inscription session introuvable.', 404);
    console.error('[examens PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}
