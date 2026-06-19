import { createPrismaClient } from '@repo/database';
import { setupStatsAggregation } from './stats-aggregator';
import { setupNotificationDispatcher } from './notification-dispatcher';
import { setupRhAbsenceSync } from './rh-absence-sync';
import { setupEquipmentSessionRelease } from './equipment-session-release';
import { setupReportGenerator } from './report-generator';
import { setupReportScheduler } from './report-scheduler';
import { setupComplianceAuditor } from './compliance-auditor';
import { setupSessionTeamLifecycle } from './session-team-lifecycle';

const prisma = createPrismaClient('workers');

setupStatsAggregation(prisma);
setupNotificationDispatcher(prisma);
setupRhAbsenceSync(prisma);
setupEquipmentSessionRelease(prisma);
setupReportGenerator(prisma);
setupReportScheduler(prisma);
setupComplianceAuditor(prisma);
setupSessionTeamLifecycle(prisma);

console.log(
  '[Worker] Stats (hourly) + CRM events (1 min) + RH absences + équipements + rapports PDF (30s) + planifications (15 min) + conformité (15 min) + équipes session (hourly).',
);

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
