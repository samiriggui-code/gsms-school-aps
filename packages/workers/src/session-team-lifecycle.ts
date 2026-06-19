import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import {
  provisionMissingSessionTeams,
  sweepSessionTeamLifecycle,
} from '@repo/api-core';

/** Équipes pédagogiques auto par session : provision + cycle POST_EXAM / ARCHIVED. */
export function setupSessionTeamLifecycle(prisma: PrismaClient) {
  const run = async (label: string) => {
    try {
      const provisioned = await provisionMissingSessionTeams(prisma);
      const sweep = await sweepSessionTeamLifecycle(prisma);
      if (provisioned > 0 || sweep.postExamTeams > 0 || sweep.archivedTeams > 0) {
        console.log(
          `[Worker] Équipes session (${label}) : ${provisioned} provisionnée(s), ` +
            `${sweep.postExamTeams} post-examen, ${sweep.archivedTeams} archivée(s) ` +
            `(${sweep.sessionsScanned} session(s) scannée(s)).`,
        );
      }
    } catch (error) {
      console.error(`[Worker] Équipes session (${label}) :`, error);
    }
  };

  cron.schedule('15 6 * * *', () => run('daily'));
  cron.schedule('15 * * * *', () => run('hourly'));
}
