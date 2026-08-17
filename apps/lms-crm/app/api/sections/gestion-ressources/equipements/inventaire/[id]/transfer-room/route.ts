import { NextRequest } from 'next/server';
import { Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ id: string }> };

/**
 * Transfère une unité entre salles (ou vers le stock global si toVenueRoomId null).
 * Crée un mouvement TRANSFER pour traçabilité.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id: equipmentId } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const toVenueRoomId = body.toVenueRoomId ? String(body.toVenueRoomId).trim() : null;
  const reason = String(body.reason ?? '').trim() || 'Transfert inter-salles';
  const notes = String(body.notes ?? '').trim() || null;

  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        roomFixedAssignment: {
          include: { venueRoom: { select: { id: true, name: true } } },
        },
      },
    });
    if (!equipment) return fail('Équipement introuvable.', 404);

    const fromRoom = equipment.roomFixedAssignment;
    const fromRoomId = fromRoom?.venueRoomId ?? null;
    const fromRoomName = fromRoom?.venueRoom.name ?? null;

    if (fromRoomId === toVenueRoomId) {
      return fail('La salle de destination est identique à la source.', 400);
    }

    if (toVenueRoomId) {
      const destRoom = await prisma.formationVenueRoom.findUnique({ where: { id: toVenueRoomId } });
      if (!destRoom) return fail('Salle de destination introuvable.', 404);
    }

    const movementNotes = JSON.stringify({
      reason,
      notes,
      fromRoomId,
      fromRoomName,
      toVenueRoomId,
      equipmentLabel: equipment.label,
      serialNumber: equipment.serialNumber,
    });

    const result = await prisma.$transaction(async (tx) => {
      if (fromRoom) {
        await tx.venueRoomFixedEquipment.delete({ where: { id: fromRoom.id } });
      }

      let assignment = null;
      if (toVenueRoomId) {
        assignment = await tx.venueRoomFixedEquipment.create({
          data: {
            venueRoomId: toVenueRoomId,
            equipmentId,
            quantity: 1,
            notes: notes ?? reason,
            installedAt: new Date(),
          },
          include: { venueRoom: { select: { id: true, name: true } } },
        });
      }

      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: toVenueRoomId ? 'IN_USE' : 'AVAILABLE' },
      });

      const movement = await tx.stockMovement.create({
        data: {
          equipmentId,
          type: 'TRANSFER',
          quantity: 1,
          notes: movementNotes,
          movementDate: new Date(),
        },
      });

      return { assignment, movement };
    });

    return ok({
      equipmentId,
      fromRoomId,
      toVenueRoomId,
      assignment: result.assignment
        ? {
            id: result.assignment.id,
            roomId: result.assignment.venueRoomId,
            roomName: result.assignment.venueRoom.name,
          }
        : null,
      movementId: result.movement.id,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('Cette unité est déjà affectée à une autre salle.', 409);
    }
    return fail('Transfert impossible.', 500, error);
  }
}
