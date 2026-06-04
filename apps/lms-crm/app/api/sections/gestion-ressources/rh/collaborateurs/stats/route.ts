import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { StatService } from '@repo/api-core';
import { getRhCollaborateursFlatStats } from '../../../_lib/rh-collaborateurs-stats';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const url = new URL(request.url);
    const months = Math.max(1, Math.min(24, Number(url.searchParams.get('months') || 12)));
    const profileType = (url.searchParams.get('profileType') || '').trim();

    if (profileType) {
      const flat = await getRhCollaborateursFlatStats(months, profileType);
      return ok(flat);
    }

    const statService = new StatService(prisma);
    const stats = await statService.getCollaborateursStats(months);
    return ok(stats);
  } catch (error) {
    return fail('Impossible de récupérer les statistiques.', 500, error);
  }
}
