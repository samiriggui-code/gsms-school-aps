import type { Prisma, PrismaClient } from '@repo/database';

/** Chevauchement d’intervalles [a1,a2] et [b1,b2] (dates inclusives côté bornes). */
export function venueRoomIntervalsOverlap(a1: Date, a2: Date, b1: Date, b2: Date): boolean {
  return a1.getTime() <= b2.getTime() && b1.getTime() <= a2.getTime();
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
 * Vérifie qu’aucune autre session catalogue n’occupe la même salle sur la même période.
 * N’applique pas le contrôle si salle ou dates manquantes.
 */
export async function assertVenueRoomAvailableForRange(
  prisma: Prisma.TransactionClient,
  args: {
    venueRoomId: string | null | undefined;
    startDate: Date | null | undefined;
    endDate: Date | null | undefined;
    excludeSessionId?: string | null;
    /** Message préfixe (ex. création vs mise à jour). */
    label?: string;
  },
): Promise<void> {
  const { venueRoomId, startDate, endDate, excludeSessionId } = args;
  if (!venueRoomId || !startDate || !endDate) return;

  const conflict = await prisma.formationSession.findFirst({
    where: {
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      venueRoomId,
      startDate: { not: null },
      endDate: { not: null },
      AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
    },
    select: {
      id: true,
      dateDisplayLabel: true,
      formation: { select: { name: true } },
    },
  });

  if (conflict) {
    const sessionLabel = conflict.dateDisplayLabel?.trim() || conflict.formation?.name || conflict.id;
    throw new Error(
      `Salle déjà réservée sur cette période pour la session « ${sessionLabel} ». Choisissez une autre salle ou des dates différentes.`,
    );
  }
}
