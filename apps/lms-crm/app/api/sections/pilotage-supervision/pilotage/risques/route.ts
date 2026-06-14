import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { PilotageHubService } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const moduleId = new URL(request.url).searchParams.get('module')?.trim() || 'gestion-ressources';

  try {
    const service = new PilotageHubService(prisma);
    const data = await service.getRisques(moduleId);
    if (!data) {
      return ok({
        moduleId,
        available: false,
        message: 'Module en cours de déploiement — données gestion ressources actives.',
      });
    }
    return ok({ ...data, available: true });
  } catch (error) {
    console.error('[pilotage-risques]', error);
    return fail('Impossible de charger les risques.', 500, error);
  }
}
