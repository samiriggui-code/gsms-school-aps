import { createPrismaClient } from '@repo/database';
import { setupStatsAggregation } from './stats-aggregator';
import { setupNotificationDispatcher } from './notification-dispatcher';
import { setupRhAbsenceSync } from './rh-absence-sync';
import { setupEquipmentSessionRelease } from './equipment-session-release';
import { setupReportGenerator } from './report-generator';
import { setupReportScheduler } from './report-scheduler';
import { setupComplianceAuditor } from './compliance-auditor';
import { setupSessionTeamLifecycle } from './session-team-lifecycle';
import { setupSupportBacklogMonitor } from './support-backlog';
import { setupAiRunExecutor } from './ai-run-executor';
import { waitForDatabase } from './wait-for-database';

async function main() {
  const prisma = createPrismaClient('workers');

  try {
    await waitForDatabase(prisma);
  } catch (error) {
    console.error(
      '[Worker] Impossible de joindre PostgreSQL. Vérifiez que le service est démarré (Laragon) et que DATABASE_URL est correct.',
    );
    console.error(error);
    process.exit(1);
  }

  setupStatsAggregation(prisma);
  setupNotificationDispatcher(prisma);
  setupRhAbsenceSync(prisma);
  setupEquipmentSessionRelease(prisma);
  setupReportGenerator(prisma);
  setupReportScheduler(prisma);
  setupComplianceAuditor(prisma);
  setupSessionTeamLifecycle(prisma);
  setupSupportBacklogMonitor(prisma);
  setupAiRunExecutor(prisma);

  console.log(
    '[Worker] Stats (hourly) + CRM events (1 min) + RH absences + équipements + rapports PDF (30s) + planifications (15 min) + conformité (15 min) + équipes session (hourly) + backlog support (daily 8h) + AiRun/AgentTask (15–30s).',
  );

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('[Worker] Démarrage impossible:', error);
  process.exit(1);
});
