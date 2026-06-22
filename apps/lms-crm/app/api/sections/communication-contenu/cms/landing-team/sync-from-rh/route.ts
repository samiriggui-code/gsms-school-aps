import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { syncLandingTeamOffersFromRhTeams } from '@/lib/landing-team-catalog-sync';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

/** Republie le catalogue landing équipe depuis les 3 équipes RH permanentes. */
export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.ressourcesEdit)) {
    return fail('Accès refusé.', 403);
  }

  try {
    const result = await syncLandingTeamOffersFromRhTeams(prisma);
    return ok(result);
  } catch (error) {
    return fail('Synchronisation impossible.', 500, error);
  }
}
