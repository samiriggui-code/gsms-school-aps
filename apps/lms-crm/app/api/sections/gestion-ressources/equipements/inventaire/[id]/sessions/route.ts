import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { formationSessionRelationInclude } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_session-include';
import { requireGestionRessourcesView } from '../../../../_lib/require-gestion-ressources-auth';

function normalizeEquipmentIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  if (typeof value === 'string') {
    try {
      return normalizeEquipmentIds(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail('ID manquant', 400);

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Number(url.searchParams.get('limit') || 10));
  const skip = (page - 1) * limit;

  try {
    const allSessions = await prisma.formationSession.findMany({
      include: {
        ...formationSessionRelationInclude,
        trainer: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    const matched = allSessions.filter((s) =>
      normalizeEquipmentIds(s.reservedEquipmentIds).includes(id),
    );

    const total = matched.length;
    const pageItems = matched.slice(skip, skip + limit);

    const data = pageItems.map((s) => ({
      id: s.id,
      sessionId: s.id,
      sessionTitle: s.sessionSubtitle || s.dateDisplayLabel || s.formation?.name || 'Session',
      formationName: s.formation?.name ?? null,
      startDate: s.startDate?.toISOString() ?? '',
      endDate: s.endDate?.toISOString() ?? '',
      venueRoomName: s.venueRoom?.name ?? null,
      location: s.location ?? null,
      trainerName: s.trainer?.name ?? null,
      clientSiteName: s.venueRoom?.name ?? s.location,
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
    return fail('Impossible de récupérer les affectations.', 500, error);
  }
}
