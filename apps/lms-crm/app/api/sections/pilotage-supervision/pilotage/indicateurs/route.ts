import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { PilotageHubService, type PilotagePeriod } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

const PERIODS = new Set<PilotagePeriod>(['day', 'week', 'month', 'year']);

function parsePeriod(raw: string | null): PilotagePeriod {
  if (raw && PERIODS.has(raw as PilotagePeriod)) return raw as PilotagePeriod;
  return 'month';
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) return fail('Unauthorized request', 401);

  const url = new URL(request.url);
  const moduleId = url.searchParams.get('module')?.trim() || 'gestion-ressources';
  const period = parsePeriod(url.searchParams.get('period'));

  try {
    const service = new PilotageHubService(prisma);
    const data = await service.getIndicateurs(moduleId, period);
    if (!data) {
      return ok({
        moduleId,
        period,
        available: false,
        message: 'Module en cours de déploiement — données gestion ressources actives.',
      });
    }
    return ok({ ...data, available: true });
  } catch (error) {
    console.error('[pilotage-indicateurs]', error);
    return fail('Impossible de charger les indicateurs.', 500, error);
  }
}
