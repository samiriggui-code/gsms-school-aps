import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ id: string; assignmentId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id: venueRoomId, assignmentId } = await params;
  try {
    const row = await prisma.venueRoomFixedEquipment.findFirst({
      where: { id: assignmentId, venueRoomId },
      include: {
        equipment: { select: { id: true, label: true, serialNumber: true } },
        venueRoom: { select: { name: true } },
      },
    });
    if (!row) return fail('Affectation introuvable.', 404);

    await prisma.$transaction([
      prisma.venueRoomFixedEquipment.delete({ where: { id: assignmentId } }),
      prisma.equipment.update({
        where: { id: row.equipmentId },
        data: { status: 'AVAILABLE' },
      }),
      prisma.stockMovement.create({
        data: {
          equipmentId: row.equipmentId,
          type: 'TRANSFER',
          quantity: 1,
          movementDate: new Date(),
          notes: JSON.stringify({
            reason: 'Retour stock global depuis salle',
            fromVenueRoomId: venueRoomId,
            roomName: row.venueRoom.name,
          }),
        },
      }),
    ]);
    return ok({ deleted: true });
  } catch (error) {
    return fail('Impossible de retirer l\'équipement.', 500, error);
  }
}
