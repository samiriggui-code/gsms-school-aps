import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import { releaseEndedSessionsEquipment } from '@repo/api-core';

/** Libère le matériel des sessions catalogue terminées (quotidien). */
export function setupEquipmentSessionRelease(prisma: PrismaClient) {
  const run = async (label: string) => {
    try {
      const result = await releaseEndedSessionsEquipment(prisma);
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
