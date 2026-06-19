import type { Prisma, PrismaClient } from '@repo/database';

type Db = PrismaClient | Prisma.TransactionClient;

/** Chevauchement d’intervalles [a1,a2] et [b1,b2]. */
export function intervalsOverlap(a1: Date, a2: Date, b1: Date, b2: Date): boolean {
  return a1.getTime() <= b2.getTime() && b1.getTime() <= a2.getTime();
}

export async function assertVenueRoomSlotAvailable(
  db: Db,
  args: {
    venueRoomId: string;
    start: Date;
    end: Date;
    excludeSessionId?: string | null;
    excludeBookingId?: string | null;
  },
): Promise<void> {
  const { venueRoomId, start, end, excludeSessionId, excludeBookingId } = args;
  if (end.getTime() < start.getTime()) {
    throw new Error('La date de fin doit être postérieure au début.');
  }

  const sessionConflict = await db.formationSession.findFirst({
    where: {
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      venueRoomId,
      startDate: { not: null },
      endDate: { not: null },
      AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
    },
    select: {
      id: true,
      dateDisplayLabel: true,
      formation: { select: { name: true } },
    },
  });

  if (sessionConflict) {
    const label =
      sessionConflict.dateDisplayLabel?.trim() ||
      sessionConflict.formation?.name ||
      sessionConflict.id;
    throw new Error(
      `Salle déjà réservée pour la session « ${label} » sur cette période.`,
    );
  }

  const bookingConflict = await db.venueRoomBooking.findFirst({
    where: {
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      venueRoomId,
      status: 'ACTIVE',
      startAt: { lte: end },
      endAt: { gte: start },
    },
    select: { id: true, title: true },
  });

  if (bookingConflict) {
    throw new Error(
      `Salle déjà réservée pour « ${bookingConflict.title} » sur cette période.`,
    );
  }
}
