import { createPrismaClient } from '@repo/database';
import { setupStatsAggregation } from './stats-aggregator';
import { setupNotificationDispatcher } from './notification-dispatcher';

const prisma = createPrismaClient('workers');

setupStatsAggregation(prisma);
setupNotificationDispatcher(prisma);

console.log('[Worker] Stats aggregator (hourly) + CRM events dispatcher (every minute).');

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
