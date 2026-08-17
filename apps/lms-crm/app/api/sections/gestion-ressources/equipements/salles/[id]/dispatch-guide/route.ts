import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { getEquipmentCatalogKey } from '@/lib/equipment-catalog-taxonomy';
import {
  buildRoomFixedRequirements,
  dispatchGuideSummary,
  evaluateDispatchLines,
  inferRoomProfile,
  roomProfileLabel,
} from '@/lib/equipment-dispatch-guide';
import { requireGestionRessourcesView } from '../../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id: venueRoomId } = await params;

  try {
    const room = await prisma.formationVenueRoom.findUnique({ where: { id: venueRoomId } });
    if (!room) return fail('Salle introuvable.', 404);

    const [fixedRows, allEquipment] = await Promise.all([
      prisma.venueRoomFixedEquipment.findMany({
        where: { venueRoomId },
        include: { equipment: { select: { metadata: true, label: true } } },
      }),
      prisma.equipment.findMany({
        select: {
          id: true,
          label: true,
          metadata: true,
          status: true,
          roomFixedAssignment: { select: { id: true } },
        },
      }),
    ]);

    const assignedByCatalogKey = new Map<string, number>();
    for (const row of fixedRows) {
      const key = getEquipmentCatalogKey(row.equipment.metadata, row.equipment.label);
      assignedByCatalogKey.set(key, (assignedByCatalogKey.get(key) ?? 0) + 1);
    }

    const availableGlobalByCatalogKey = new Map<string, number>();
    for (const eq of allEquipment) {
      if (eq.status !== 'AVAILABLE' || eq.roomFixedAssignment) continue;
      const key = getEquipmentCatalogKey(eq.metadata, eq.label);
      availableGlobalByCatalogKey.set(key, (availableGlobalByCatalogKey.get(key) ?? 0) + 1);
    }

    const profile = inferRoomProfile(room);
    const capacity = room.capacity ?? 16;
    const requirements = buildRoomFixedRequirements(profile, capacity);
    const lines = evaluateDispatchLines(requirements, assignedByCatalogKey, availableGlobalByCatalogKey);
    const summary = dispatchGuideSummary(lines);

    return ok({
      context: 'ROOM_FIXED',
      room: {
        id: room.id,
        name: room.name,
        shortCode: room.shortCode,
        capacity: room.capacity,
      },
      profile,
      profileLabel: roomProfileLabel(profile),
      summary,
      lines,
      helpText:
        'Liez des unités depuis le stock global. Le mobilier fixé ici reste dans la salle ; les sessions sur cette salle utilisent cet équipement sans le réserver à nouveau.',
    });
  } catch (error) {
    return fail('Impossible de charger le guide dispatch.', 500, error);
  }
}
