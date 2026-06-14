import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../../../_lib/require-gestion-ressources-auth';

function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value.length <= 10 ? `${value}T12:00:00.000Z` : value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/** Planning des salles : sessions par salle sur une période. */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const now = new Date();
  const from = parseDateParam(url.searchParams.get('from'), new Date(now.getFullYear(), now.getMonth(), 1));
  const to = parseDateParam(
    url.searchParams.get('to'),
    new Date(now.getFullYear(), now.getMonth() + 2, 0),
  );

  try {
    const [rooms, sessions] = await Promise.all([
      prisma.formationVenueRoom.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.formationSession.findMany({
        where: {
          venueRoomId: { not: null },
          startDate: { not: null, lte: to },
          endDate: { not: null, gte: from },
        },
        select: {
          id: true,
          venueRoomId: true,
          dateDisplayLabel: true,
          sessionKind: true,
          sessionSubtitle: true,
          startDate: true,
          endDate: true,
          location: true,
          formation: { select: { name: true } },
          trainer: { select: { firstName: true, lastName: true, name: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const byRoom = new Map<string, typeof sessions>();
    for (const s of sessions) {
      if (!s.venueRoomId) continue;
      const list = byRoom.get(s.venueRoomId) ?? [];
      list.push(s);
      byRoom.set(s.venueRoomId, list);
    }

    return ok({
      from: from.toISOString(),
      to: to.toISOString(),
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        shortCode: room.shortCode,
        capacity: room.capacity,
        floorLabel: room.floorLabel,
        sessions: (byRoom.get(room.id) ?? []).map((s) => ({
          id: s.id,
          label: s.dateDisplayLabel,
          formationName: s.formation?.name ?? null,
          sessionKind: s.sessionKind,
          sessionSubtitle: s.sessionSubtitle,
          startDate: s.startDate?.toISOString() ?? null,
          endDate: s.endDate?.toISOString() ?? null,
          location: s.location,
          trainerName:
            [s.trainer?.firstName, s.trainer?.lastName].filter(Boolean).join(' ') ||
            s.trainer?.name ||
            null,
        })),
      })),
    });
  } catch (error) {
    return fail('Impossible de charger le planning des salles.', 500, error);
  }
}
