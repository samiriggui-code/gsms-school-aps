import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import {
  notifyVenueRoomSessionEnded,
  releaseEndedSessionsEquipment,
} from '@repo/api-core';

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function notifyEndedSessionRooms(prisma: PrismaClient) {
  const today = startOfTodayUtc();
  const sessions = await prisma.formationSession.findMany({
    where: {
      endDate: { not: null, lt: today },
      venueRoomId: { not: null },
    },
    select: {
      id: true,
      dateDisplayLabel: true,
      venueRoomId: true,
      venueRoom: { select: { id: true, name: true } },
      formation: { select: { name: true } },
    },
    take: 40,
  });

  for (const session of sessions) {
    if (!session.venueRoomId || !session.venueRoom) continue;
    await notifyVenueRoomSessionEnded(prisma, {
      sessionId: session.id,
      roomId: session.venueRoom.id,
      roomName: session.venueRoom.name,
      sessionLabel: session.dateDisplayLabel || 'Session',
      formationName: session.formation?.name ?? null,
    });
  }
}

/** Libère le matériel des sessions catalogue terminées (quotidien). */
export function setupEquipmentSessionRelease(prisma: PrismaClient) {
  const run = async (label: string) => {
    try {
      const result = await releaseEndedSessionsEquipment(prisma, { notifySource: 'worker' });
      await notifyEndedSessionRooms(prisma);
      if (result.equipmentReleased > 0) {
        console.log(
          `[Worker] Équipements sessions (${label}) : ${result.equipmentReleased} pièce(s) libérée(s) sur ${result.sessionsScanned} session(s) passée(s).`,
        );
      }
    } catch (error) {
      console.error(`[Worker] Libération équipements sessions (${label}) :`, error);
    }
  };

  cron.schedule('30 6 * * *', () => run('daily'));
  cron.schedule('0 * * * *', () => run('hourly'));
}
