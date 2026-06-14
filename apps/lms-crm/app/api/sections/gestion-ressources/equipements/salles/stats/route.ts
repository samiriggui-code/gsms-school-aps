import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../../../_lib/require-gestion-ressources-auth';

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const today = startOfTodayUtc();

    const [total, actives, inactives, sessions] = await Promise.all([
      prisma.formationVenueRoom.count(),
      prisma.formationVenueRoom.count({ where: { isActive: true } }),
      prisma.formationVenueRoom.count({ where: { isActive: false } }),
      prisma.formationSession.findMany({
        where: {
          venueRoomId: { not: null },
          startDate: { not: null },
          endDate: { not: null },
        },
        select: { venueRoomId: true, startDate: true, endDate: true },
      }),
    ]);

    const reservedTodayRoomIds = new Set<string>();
    let sessionsUpcoming = 0;

    for (const s of sessions) {
      if (!s.venueRoomId || !s.startDate || !s.endDate) continue;
      if (s.startDate <= today && s.endDate >= today) {
        reservedTodayRoomIds.add(s.venueRoomId);
      }
      if (s.endDate >= today) {
        sessionsUpcoming += 1;
      }
    }

    const disponibles = Math.max(0, actives - reservedTodayRoomIds.size);

    return ok({
      total,
      actives,
      inactives,
      reservedToday: reservedTodayRoomIds.size,
      disponibles,
      sessionsUpcoming,
    });
  } catch (error) {
    return fail('Impossible de charger les statistiques des salles.', 500, error);
  }
}
