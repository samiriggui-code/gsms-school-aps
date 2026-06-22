import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { listEligibleSessionLearners } from '../_eligible-session-learners';

/**
 * Apprenants éligibles à l'inscription session :
 * dossier candidature VALIDATED (conforme, validé administration) pour la formation indiquée.
 *
 * Query : `formationId` (uuid, requis), `includeUserIds` (ids déjà inscrits à conserver en édition, optionnel).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const url = new URL(request.url);
    const formationId = url.searchParams.get('formationId')?.trim() ?? '';
    if (!formationId) {
      return fail('Paramètre formationId requis.', 400);
    }

    const formation = await prisma.formation.findUnique({
      where: { id: formationId },
      select: { id: true },
    });
    if (!formation) {
      return fail('Formation introuvable.', 404);
    }

    const includeRaw = url.searchParams.get('includeUserIds')?.trim() ?? '';
    const includeUserIds = includeRaw
      ? includeRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const items = await listEligibleSessionLearners(prisma, formationId, includeUserIds);

    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger les apprenants éligibles.', 500, error);
  }
}
