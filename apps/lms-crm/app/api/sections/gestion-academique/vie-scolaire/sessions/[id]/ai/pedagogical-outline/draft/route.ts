import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { enqueueSessionPedagogicalOutlineDraft } from '@/lib/ai/session-pedagogical-outline-ai';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ id: string }> };

/** GSMS-AI-03 — enfile un brouillon déroulé (AiRun PENDING, exécution worker). */
export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  if (!id?.trim()) return fail('Session id manquant.', 400);

  try {
    const row = await prisma.formationSession.findUnique({
      where: { id: id.trim() },
      select: { id: true },
    });
    if (!row) return fail('Session introuvable.', 404);

    const run = await enqueueSessionPedagogicalOutlineDraft({
      sessionId: row.id,
      requestedById: session.user.id,
    });

    return ok(
      {
        runId: run.id,
        status: run.status,
        message: 'Génération en cours — le brouillon apparaîtra dans quelques instants.',
      },
      202,
    );
  } catch (e) {
    console.error('[ai/pedagogical-outline draft]', e);
    return fail('Mise en file de la génération impossible.', 500, e);
  }
}
