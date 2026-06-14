import type { PrismaClient } from '@repo/database';
import { ReportScheduleService } from '@repo/api-core';
import cron from 'node-cron';

/** Vérifie les planifications dues toutes les 15 minutes. */
const SCHEDULE_CRON = '*/15 * * * *';

export function setupReportScheduler(prisma: PrismaClient) {
  if (process.env.REPORT_SCHEDULER_DISABLED === '1') {
    console.log('[ReportScheduler] désactivé (REPORT_SCHEDULER_DISABLED=1)');
    return;
  }

  const service = new ReportScheduleService(prisma);

  cron.schedule(SCHEDULE_CRON, async () => {
    try {
      const n = await service.processDueSchedules(5);
      if (n > 0) console.log(`[ReportScheduler] ${n} rapport(s) planifié(s) en file`);
    } catch (e) {
      console.error('[ReportScheduler] erreur', e);
    }
  });

  console.log('[ReportScheduler] planifications quotidien / mensuel / trimestriel actives');
}
