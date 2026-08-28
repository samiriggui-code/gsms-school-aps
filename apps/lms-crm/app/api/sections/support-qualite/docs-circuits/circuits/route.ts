import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

/**
 * Vue transverse des circuits session (SessionAutomationRun) — hub OF-08.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status')?.trim() || '';
  const take = Math.min(Math.max(Number(searchParams.get('take') ?? 50) || 50, 1), 100);

  try {
    const items = await prisma.sessionAutomationRun.findMany({
      where: status
        ? { status: status as 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' }
        : undefined,
      orderBy: { startedAt: 'desc' },
      take,
      select: {
        id: true,
        circuitKey: true,
        status: true,
        n8nExecutionId: true,
        startedAt: true,
        completedAt: true,
        cancelledAt: true,
        session: {
          select: {
            id: true,
            dateDisplayLabel: true,
            formation: { select: { name: true } },
          },
        },
      },
    });

    return ok({
      items: items.map((row) => ({
        id: row.id,
        circuitKey: row.circuitKey,
        status: row.status,
        n8nExecutionId: row.n8nExecutionId,
        startedAt: row.startedAt.toISOString(),
        completedAt: row.completedAt?.toISOString() ?? null,
        cancelledAt: row.cancelledAt?.toISOString() ?? null,
        sessionId: row.session.id,
        sessionLabel: row.session.dateDisplayLabel,
        formationName: row.session.formation.name,
      })),
    });
  } catch (e) {
    return fail('Lecture circuits impossible.', 500, e);
  }
}
