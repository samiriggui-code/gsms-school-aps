import { NextRequest } from 'next/server';
import { notifyVenueRoomStaffBookingCancelled } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ id: string }> };

/** Annule une réservation ponctuelle de salle. */
export async function PATCH(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail('Identifiant requis.', 400);

  try {
    const existing = await prisma.venueRoomBooking.findUnique({
      where: { id },
      include: { venueRoom: { select: { id: true, name: true } } },
    });
    if (!existing) return fail('Réservation introuvable.', 404);

    const row = await prisma.venueRoomBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    if (existing.status === 'ACTIVE') {
      await notifyVenueRoomStaffBookingCancelled(prisma, {
        bookingId: row.id,
        roomId: existing.venueRoomId,
        roomName: existing.venueRoom.name,
        title: existing.title,
        actorUserId: auth.userId ?? null,
      });
    }

    return ok({ id: row.id, status: row.status });
  } catch (error) {
    return fail('Impossible d\'annuler la réservation.', 500, error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return PATCH(_request, { params });
}
