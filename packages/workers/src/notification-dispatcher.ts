import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import { CrmEventService } from '@repo/api-core';

/** Traite la file `CrmEventOutbox` → notifications in-app (cloche + landings). */
export function setupNotificationDispatcher(prisma: PrismaClient) {
  const events = new CrmEventService(prisma);

  cron.schedule('* * * * *', async () => {
    try {
      const { processed, total } = await events.processPending(40);
      if (total > 0) {
        console.log(`[Worker] Événements CRM : ${processed}/${total} traités.`);
      }
    } catch (error) {
      console.error('[Worker] Erreur file événements CRM:', error);
    }
  });
}
