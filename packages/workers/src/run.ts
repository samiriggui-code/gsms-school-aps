import { createPrismaClient } from '@repo/database';
import { setupStatsAggregation } from './stats-aggregator';
import { setupNotificationDispatcher } from './notification-dispatcher';
import { setupRhAbsenceSync } from './rh-absence-sync';
import { setupEquipmentSessionRelease } from './equipment-session-release';
import { setupReportGenerator } from './report-generator';
import { setupReportScheduler } from './report-scheduler';

const prisma = createPrismaClient('workers');

setupStatsAggregation(prisma);
setupNotificationDispatcher(prisma);
setupRhAbsenceSync(prisma);
setupEquipmentSessionRelease(prisma);
setupReportGenerator(prisma);
setupReportScheduler(prisma);

console.log(
  '[Worker] Stats (hourly) + CRM events (1 min) + RH absences + équipements + rapports PDF (30s) + planifications (15 min).',
);

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
