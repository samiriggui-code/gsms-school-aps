import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { enqueueFormationProgramModulesDraft } from '@/lib/ai/formation-program-modules-ai';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ slug: string }> };

/** Déclenche un brouillon IA du programme (GSMS-AI-02) — écrit un AiArtifact PROPOSED, jamais la fiche. */
export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { slug } = await context.params;
  if (!slug?.trim()) return fail('Slug manquant.', 400);

  try {
    const formation = await prisma.formation.findUnique({
      where: { slug: slug.trim() },
      select: { id: true },
    });
    if (!formation) return fail('Formation introuvable.', 404);

    const run = await enqueueFormationProgramModulesDraft({
      formationId: formation.id,
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
    console.error('[ai/program-modules draft]', e);
    return fail('Génération du brouillon impossible.', 500, e);
  }
}
