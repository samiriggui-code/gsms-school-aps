import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { PilotageHubService } from '@repo/api-core';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.pilotageView)) {
    return fail('Forbidden', 403);
  }

  try {
    const service = new PilotageHubService(prisma);
    const data = await service.getLanding();
    return ok(data);
  } catch (error) {
    console.error('[pilotage-landing]', error);
    return fail('Impossible de charger le tableau de bord pilotage.', 500, error);
  }
}
