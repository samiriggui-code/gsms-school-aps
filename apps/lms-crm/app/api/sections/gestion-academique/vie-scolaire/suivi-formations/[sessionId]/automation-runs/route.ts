import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ sessionId: string }> };

/** Dernières exécutions circuit Qualiopi / n8n pour une session suivie. */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { sessionId } = await context.params;

  const formationSession = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!formationSession) return fail('Session introuvable.', 404);

  const items = await prisma.sessionAutomationRun.findMany({
    where: { sessionId },
    orderBy: { startedAt: 'desc' },
    take: 25,
    select: {
      id: true,
      circuitKey: true,
      status: true,
      n8nExecutionId: true,
      milestones: true,
      startedAt: true,
      completedAt: true,
      cancelledAt: true,
      participantId: true,
      candidatureId: true,
    },
  });

  return ok({
    items: items.map((row) => ({
      ...row,
      startedAt: row.startedAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
    })),
  });
}
