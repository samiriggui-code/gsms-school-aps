import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import { processPendingAgentTasks, processPendingAiRuns } from '@repo/api-core';

const POLL_CRON =
  process.env.AI_RUN_WORKER_POLL_CRON ??
  (process.env.NODE_ENV === 'production' ? '*/30 * * * * *' : '*/15 * * * * *');

/** Exécute AiRun PENDING + AgentTask PENDING (OPS-03 / socle EVE). */
export function setupAiRunExecutor(prisma: PrismaClient) {
  cron.schedule(POLL_CRON, async () => {
    try {
      const [aiCount, taskCount] = await Promise.all([
        processPendingAiRuns(prisma, 3),
        processPendingAgentTasks(prisma, 3),
      ]);
      if (aiCount > 0) {
        console.log(`[Worker] AiRun : ${aiCount} exécution(s) terminée(s).`);
      }
      if (taskCount > 0) {
        console.log(`[Worker] AgentTask : ${taskCount} exécution(s) terminée(s).`);
      }
    } catch (error) {
      console.error('[Worker] Erreur async agent executor:', error);
    }
  });
}
