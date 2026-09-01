import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  try {
    const sessionWhereCatalogActive = {
      formation: { catalogOffer: { catalogStatus: 'ACTIVE' as const } },
    };

    const [sessionCount, participantCount, formationCount, sessionsWithTrainerCount] = await Promise.all([
      prisma.formationSession.count({ where: sessionWhereCatalogActive }),
      prisma.formationSessionParticipant.count({
        where: { session: sessionWhereCatalogActive },
      }),
      prisma.formationCatalogOffer.count({ where: { catalogStatus: 'ACTIVE' } }),
      prisma.formationSession.count({
        where: {
          ...sessionWhereCatalogActive,
          trainerUserId: { not: null },
        },
      }),
    ]);

    return ok({
      sessionsTotal: sessionCount,
      participantsTotal: participantCount,
      formationsCatalogActive: formationCount,
      sessionsWithTrainer: sessionsWithTrainerCount,
    });
  } catch (error) {
    return fail('Impossible de charger les indicateurs sessions.', 500, error);
  }
}
