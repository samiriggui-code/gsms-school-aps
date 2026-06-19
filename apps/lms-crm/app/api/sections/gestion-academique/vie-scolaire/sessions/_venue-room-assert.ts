import type { Prisma, PrismaClient } from '@repo/database';
import { assertVenueRoomSlotAvailable, intervalsOverlap } from '@repo/api-core';

/** Chevauchement d’intervalles [a1,a2] et [b1,b2] (dates inclusives côté bornes). */
export function venueRoomIntervalsOverlap(a1: Date, a2: Date, b1: Date, b2: Date): boolean {
  return intervalsOverlap(a1, a2, b1, b2);
}

export async function assertVenueRoomIdExists(
  db: Pick<PrismaClient, 'formationVenueRoom'>,
  roomId: string | null | undefined,
): Promise<boolean> {
  if (roomId === undefined || roomId === null || roomId === '') return true;
  const n = await db.formationVenueRoom.count({
    where: { id: roomId, isActive: true },
  });
  return n === 1;
}

/**
 * Vérifie qu’aucune session catalogue ni réservation ponctuelle n’occupe la salle.
 */
export async function assertVenueRoomAvailableForRange(
  prisma: Prisma.TransactionClient | PrismaClient,
  args: {
    venueRoomId: string | null | undefined;
    startDate: Date | null | undefined;
    endDate: Date | null | undefined;
    excludeSessionId?: string | null;
    excludeBookingId?: string | null;
  },
): Promise<void> {
  const { venueRoomId, startDate, endDate, excludeSessionId, excludeBookingId } = args;
  if (!venueRoomId || !startDate || !endDate) return;

  await assertVenueRoomSlotAvailable(prisma, {
    venueRoomId,
    start: startDate,
    end: endDate,
    excludeSessionId,
    excludeBookingId,
  });
}
