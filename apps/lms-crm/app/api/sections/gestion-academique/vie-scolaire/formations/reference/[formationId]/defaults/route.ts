import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { effectiveTraineesBandForFormationScalars } from '@/lib/formation-trainee-band';

/** Gabarits financement / prérequis issus de la fiche référence `Formation` (pour menus CRM). */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ formationId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { formationId } = await context.params;
  if (!formationId?.trim()) return fail('Identifiant formation manquant.', 400);

  try {
    const formation = await prisma.formation.findUnique({
      where: { id: formationId.trim() },
      select: {
        id: true,
        fundingBlocks: true,
        prerequisitesTable: true,
        parcoursSpecialite: true,
        traineesMin: true,
        traineesMax: true,
        duration: true,
        track: true,
      },
    });
    if (!formation) return fail('Formation référence introuvable.', 404);

    const effT = effectiveTraineesBandForFormationScalars({
      traineesMin: formation.traineesMin,
      traineesMax: formation.traineesMax,
      duration: formation.duration,
      track: formation.track,
    });

    return ok({
      formationId: formation.id,
      fundingBlocks: formation.fundingBlocks ?? [],
      prerequisitesTable: formation.prerequisitesTable ?? [],
      parcoursSpecialite: formation.parcoursSpecialite,
      traineesMin: effT.traineesMin,
      traineesMax: effT.traineesMax,
    });
  } catch (error) {
    return fail('Impossible de charger les gabarits de la formation.', 500, error);
  }
}
