import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { AI_PROGRAM_MODULES_USE_CASE } from '@/lib/ai/formation-program-modules-ai';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ slug: string }> };

/** Liste les artefacts IA « brouillon programme » pour une formation, du plus récent au plus ancien. */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
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

    const artifacts = await prisma.aiArtifact.findMany({
      where: {
        targetEntityType: 'formation',
        targetEntityId: formation.id,
        run: { useCase: AI_PROGRAM_MODULES_USE_CASE },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        run: { select: { requestedById: true, createdAt: true, model: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    return ok({ artifacts });
  } catch (e) {
    console.error('[ai/program-modules artifacts]', e);
    return fail('Liste des brouillons impossible.', 500, e);
  }
}
