import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { StatService } from '@repo/api-core';

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

try {
    const url = new URL(request.url);
    const months = Math.max(1, Math.min(24, Number(url.searchParams.get('months') || 12)));

    const statService = new StatService(prisma);
    const stats = await statService.getCandidatsStats(months);

    return ok(stats);
  } catch (error) {
    return fail('Impossible de récupérer les statistiques.', 500, error);
  }
}
