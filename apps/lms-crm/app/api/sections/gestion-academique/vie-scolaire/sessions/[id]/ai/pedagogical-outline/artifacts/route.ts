import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { AI_PEDAGOGICAL_OUTLINE_USE_CASE } from '@/lib/ai/session-pedagogical-outline-ai';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ id: string }> };

/** Liste les brouillons déroulé pédagogique pour une session. */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
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

    const artifacts = await prisma.aiArtifact.findMany({
      where: {
        targetEntityType: 'FormationSession',
        targetEntityId: row.id,
        run: { useCase: AI_PEDAGOGICAL_OUTLINE_USE_CASE },
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
    console.error('[ai/pedagogical-outline artifacts]', e);
    return fail('Liste des brouillons impossible.', 500, e);
  }
}
