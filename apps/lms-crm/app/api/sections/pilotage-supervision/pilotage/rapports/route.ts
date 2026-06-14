import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { PilotageHubService, type PilotagePeriod } from '@repo/api-core';
import { normalizeCustomDateRange } from '@repo/report-engine';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

const PERIODS = new Set<string>(['day', 'week', 'month', 'year', 'custom']);

function parsePeriod(raw: string | null, customRange?: { start: Date; end: Date }): PilotagePeriod | 'custom' {
  if (raw === 'custom' && customRange) return 'custom';
  if (raw && PERIODS.has(raw) && raw !== 'custom') return raw as PilotagePeriod;
  if (customRange) return 'custom';
  return 'month';
}

function parseCustomRange(url: URL): { start: Date; end: Date } | undefined {
  const startRaw = url.searchParams.get('start');
  const endRaw = url.searchParams.get('end');
  if (!startRaw || !endRaw) return undefined;
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  return normalizeCustomDateRange({ start, end });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const url = new URL(request.url);
  const moduleId = url.searchParams.get('module')?.trim() || 'gestion-ressources';
  const customRange = parseCustomRange(url);
  const period = parsePeriod(url.searchParams.get('period'), customRange);

  try {
    const service = new PilotageHubService(prisma);
    const data = await service.getRapports(moduleId, period, customRange);
    if (!data) {
      return ok({
        moduleId,
        period,
        periodLabel: '—',
        available: false,
        message: 'Module en cours de déploiement — données gestion ressources actives.',
      });
    }
    return ok({ ...data, available: true });
  } catch (error) {
    console.error('[pilotage-rapports]', error);
    return fail('Impossible de charger les rapports.', 500, error);
  }
}
