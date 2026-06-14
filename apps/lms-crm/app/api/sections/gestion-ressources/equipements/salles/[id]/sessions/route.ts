import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { formationSessionRelationInclude } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_session-include';
import { requireGestionRessourcesView } from '../../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail('ID manquant', 400);

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Number(url.searchParams.get('limit') || 10));
  const skip = (page - 1) * limit;

  try {
    const where = {
      venueRoomId: id,
      startDate: { not: null },
      endDate: { not: null },
    };
    const [total, pageItems] = await Promise.all([
      prisma.formationSession.count({ where }),
      prisma.formationSession.findMany({
        where,
        include: {
          ...formationSessionRelationInclude,
          trainer: { select: { name: true, firstName: true, lastName: true } },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const data = pageItems.map((s) => ({
      id: s.id,
      sessionId: s.id,
      sessionTitle: s.sessionSubtitle || s.dateDisplayLabel || s.formation?.name || 'Session',
      formationName: s.formation?.name ?? null,
      startDate: s.startDate?.toISOString() ?? '',
      endDate: s.endDate?.toISOString() ?? '',
      location: s.location ?? null,
      trainerName:
        [s.trainer?.firstName, s.trainer?.lastName].filter(Boolean).join(' ') ||
        s.trainer?.name ||
        null,
    }));

    return ok({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return fail('Impossible de récupérer les sessions.', 500, error);
  }
}
