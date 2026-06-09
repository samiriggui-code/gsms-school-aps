import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { archiveCandidatureParcours, createWorkflowEngine } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ candidatureId: string }> };

export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { candidatureId } = await context.params;

  try {
    const row = await prisma.$transaction((tx) => archiveCandidatureParcours(tx, candidatureId));

    try {
      const user = await prisma.user.findUnique({
        where: { id: row.userId },
        select: { id: true, name: true, email: true },
      });
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.candidature.parcours.archived',
        {
          candidatureId,
          userId: row.userId,
          candidateName: user?.name ?? user?.email ?? 'Dossier',
          status: row.status,
        },
        { dedupeKey: `workflow:parcours-archive:${candidatureId}` },
      );
    } catch (e) {
      console.error('[parcours archive] workflow', e);
    }

    return ok({ candidature: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    if (msg === 'CANDIDATURE_NOT_FOUND') return fail('Candidature introuvable.', 404);
    if (msg === 'CANNOT_ARCHIVE') {
      return fail('Archivage impossible dans l’état actuel du dossier.', 400);
    }
    console.error('[parcours archive]', e);
    return fail('Archivage impossible.', 500, e);
  }
}
