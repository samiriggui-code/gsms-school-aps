import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { resolveSuiviSessionPhase } from '@/lib/suivi-formations/session-progress';

const catalogActiveWhere = {
  formation: { catalogOffer: { catalogStatus: 'ACTIVE' as const } },
};

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const now = new Date();
    const horizonPast = new Date(now);
    horizonPast.setMonth(horizonPast.getMonth() - 6);

    const rows = await prisma.formationSession.findMany({
      where: {
        ...catalogActiveWhere,
        OR: [
          { participants: { some: {} } },
          { startDate: { gte: horizonPast } },
          { endDate: { gte: horizonPast } },
        ],
      },
      orderBy: [{ startDate: 'desc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        dateDisplayLabel: true,
        location: true,
        startDate: true,
        endDate: true,
        sessionKind: true,
        _count: { select: { participants: true } },
        formation: {
          select: {
            id: true,
            name: true,
            slug: true,
            courseId: true,
          },
        },
      },
    });

    const items = rows.map((row) => {
      const phase = resolveSuiviSessionPhase(row.startDate, row.endDate, now);
      return {
        id: row.id,
        dateDisplayLabel: row.dateDisplayLabel,
        location: row.location,
        startDate: row.startDate?.toISOString() ?? null,
        endDate: row.endDate?.toISOString() ?? null,
        sessionKind: row.sessionKind,
        participantCount: row._count.participants,
        phase,
        formation: row.formation,
      };
    });

    const phaseOrder: Record<string, number> = { running: 0, upcoming: 1, unknown: 2, past: 3 };
    items.sort((a, b) => {
      const pa = phaseOrder[a.phase] ?? 9;
      const pb = phaseOrder[b.phase] ?? 9;
      if (pa !== pb) return pa - pb;
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      return db - da;
    });

    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger les sessions à suivre.', 500, error);
  }
}
