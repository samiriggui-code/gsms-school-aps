import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import { createWorkflowEngine, fetchSupportBacklogDaily } from '@repo/api-core';

/** Alerte backlog support (tickets ouverts / stale) — quotidien 8h. */
export function setupSupportBacklogMonitor(prisma: PrismaClient) {
  cron.schedule('0 8 * * *', async () => {
    try {
      const data = await fetchSupportBacklogDaily(prisma);
      if (data.openCount === 0 && data.staleCount === 0 && data.highPriority === 0) {
        return;
      }

      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.support.backlog.due',
        {
          summary: data.summary,
          openCount: data.openCount,
          staleCount: data.staleCount,
          highPriority: data.highPriority,
          generatedAt: data.generatedAt,
        },
        { dedupeKey: `support-backlog:${data.generatedAt.slice(0, 10)}` },
      );

      console.log(`[Worker] Backlog support : ${data.summary}`);
    } catch (error) {
      console.error('[Worker] Erreur backlog support:', error);
    }
  });
}
