import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import { syncAllUsersAbsenceStatus } from '@repo/api-core';

/** Synchronise les statuts collaborateurs / formateurs selon les absences RH approuvées. */
export function setupRhAbsenceSync(prisma: PrismaClient) {
  const run = async (label: string) => {
    try {
      const result = await syncAllUsersAbsenceStatus(prisma);
      if (result.changed > 0) {
        console.log(
          `[Worker] RH absences (${label}) : ${result.changed}/${result.scanned} statuts mis à jour.`,
        );
      }
    } catch (error) {
      console.error(`[Worker] RH absences sync (${label}) :`, error);
    }
  };

  cron.schedule('0 * * * *', () => run('hourly'));
  cron.schedule('15 6 * * *', () => run('daily'));
}
