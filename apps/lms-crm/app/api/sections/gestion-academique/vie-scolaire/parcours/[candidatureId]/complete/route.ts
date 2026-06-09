import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { completeCandidatureParcours, createWorkflowEngine } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ candidatureId: string }> };

export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { candidatureId } = await context.params;

  try {
    const row = await prisma.$transaction((tx) => completeCandidatureParcours(tx, candidatureId));

    try {
      const user = await prisma.user.findUnique({
        where: { id: row.userId },
        select: { id: true, name: true, email: true },
      });
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.candidature.parcours.completed',
        {
          candidatureId,
          userId: row.userId,
          candidateName: user?.name ?? user?.email ?? 'Élève',
          status: row.status,
        },
        { dedupeKey: `workflow:parcours-complete:${candidatureId}` },
      );
    } catch (e) {
      console.error('[parcours complete] workflow', e);
    }

    return ok({ candidature: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    if (msg === 'CANDIDATURE_NOT_FOUND') return fail('Candidature introuvable.', 404);
    if (msg === 'CANDIDATURE_NOT_VALIDATED') {
      return fail('Le dossier doit être validé avant clôture pédagogique.', 400);
    }
    if (msg === 'EXAM_NOT_PASSED') {
      return fail('Enregistrez un examen réussi avant de clôturer le parcours.', 400);
    }
    if (msg === 'ATTESTATION_REQUIRED') {
      return fail('Délivrez une attestation avant de clôturer le parcours.', 400);
    }
    console.error('[parcours complete]', e);
    return fail('Clôture impossible.', 500, e);
  }
}
