import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireGestionRessourcesView } from '../../_lib/require-gestion-ressources-auth';

/**
 * GET — liste légère de sessions pour le picker Passeport Qualiopi.
 * Auth ressourcesView (aligné evaluate). Read-only.
 */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const take = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('take') ?? 50) || 50, 1),
    100,
  );

  try {
    const rows = await prisma.formationSession.findMany({
      orderBy: [{ startDate: 'desc' }, { updatedAt: 'desc' }],
      take,
      select: {
        id: true,
        dateDisplayLabel: true,
        readinessStatus: true,
        startDate: true,
        endDate: true,
        formation: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    });

    return ok({
      items: rows.map((row) => ({
        id: row.id,
        label: row.dateDisplayLabel,
        formationName: row.formation.name,
        readinessStatus: row.readinessStatus,
        startDate: row.startDate?.toISOString() ?? null,
        endDate: row.endDate?.toISOString() ?? null,
        participantCount: row._count.participants,
      })),
    });
  } catch (e) {
    console.error('[qualiopi/sessions] GET', e);
    return fail('Impossible de charger les sessions.', 500, e);
  }
}
