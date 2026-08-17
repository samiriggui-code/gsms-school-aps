import { NextRequest } from 'next/server';
import { Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../../../_lib/require-gestion-ressources-auth';
import {
  serializeRoomFixedEquipmentRow,
  summarizeFixedInventory,
} from '../../_lib/serialize-room-fixed-equipment';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id: venueRoomId } = await params;
  try {
    const room = await prisma.formationVenueRoom.findUnique({ where: { id: venueRoomId } });
    if (!room) return fail('Salle introuvable.', 404);

    const rows = await prisma.venueRoomFixedEquipment.findMany({
      where: { venueRoomId },
      orderBy: { createdAt: 'asc' },
      include: {
        equipment: { include: { maintenanceItems: true } },
      },
    });

    const items = rows.map(serializeRoomFixedEquipmentRow);
    return ok({
      items,
      summary: summarizeFixedInventory(items),
    });
  } catch (error) {
    return fail('Impossible de charger l\'inventaire fixe.', 500, error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id: venueRoomId } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const equipmentId = String(body.equipmentId ?? '').trim();
  if (!equipmentId) return fail('Équipement requis.', 400);

  const notes = String(body.notes ?? '').trim() || null;
  const installedAtRaw = String(body.installedAt ?? '').trim();
  const installedAt = installedAtRaw ? new Date(installedAtRaw) : null;

  try {
    const [room, equipment, existing] = await Promise.all([
      prisma.formationVenueRoom.findUnique({ where: { id: venueRoomId } }),
      prisma.equipment.findUnique({ where: { id: equipmentId } }),
      prisma.venueRoomFixedEquipment.findUnique({ where: { equipmentId } }),
    ]);

    if (!room) return fail('Salle introuvable.', 404);
    if (!equipment) return fail('Équipement introuvable.', 404);
    if (existing && existing.venueRoomId !== venueRoomId) {
      return fail('Cet équipement est déjà affecté en inventaire fixe d\'une autre salle.', 409);
    }

    const row = existing
      ? await prisma.venueRoomFixedEquipment.update({
          where: { id: existing.id },
          data: { quantity: 1, notes, installedAt },
          include: { equipment: { include: { maintenanceItems: true } } },
        })
      : await prisma.venueRoomFixedEquipment.create({
          data: { venueRoomId, equipmentId, quantity: 1, notes, installedAt },
          include: { equipment: { include: { maintenanceItems: true } } },
        });

    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'IN_USE' },
    });

    await prisma.stockMovement.create({
      data: {
        equipmentId,
        type: 'TRANSFER',
        quantity: 1,
        movementDate: new Date(),
        notes: JSON.stringify({
          reason: 'Affectation inventaire fixe salle',
          venueRoomId,
          roomName: room.name,
        }),
      },
    });

    return ok({ item: serializeRoomFixedEquipmentRow(row) }, existing ? 200 : 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('Équipement déjà lié à une salle.', 409);
    }
    return fail('Impossible d\'affecter l\'équipement.', 500, error);
  }
}
