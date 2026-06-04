import { NextRequest } from 'next/server';
import { CrmEventService } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireSessionUserId } from '@/app/api/_shared/topbar-auth';

export async function GET(request: NextRequest) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const moduleKey = new URL(request.url).searchParams.get('module')?.trim();
  if (!moduleKey) return fail('Paramètre module requis.', 400);

  const limit = Math.min(
    30,
    Math.max(1, parseInt(new URL(request.url).searchParams.get('limit') || '12', 10) || 12),
  );

  try {
    const service = new CrmEventService(prisma);
    const items = await service.listModuleAlertsForUser(auth.userId, moduleKey, {
      limit,
      includeChildModules: true,
    });
    return ok({ moduleKey, items });
  } catch (error) {
    console.error('[module-alerts GET]', error);
    return fail('Impossible de charger les alertes du module.', 500, error);
  }
}
