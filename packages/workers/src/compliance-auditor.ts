import cron from 'node-cron';
import type { PrismaClient } from '@repo/database';
import { ComplianceService } from '@repo/api-core/compliance-service';

/** Audit conformité documentaire : réévaluation, relances e-mail, alertes. */
export function setupComplianceAuditor(prisma: PrismaClient) {
  const service = new ComplianceService(prisma);

  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await service.auditOpenDossiers({
        limit: 80,
        sendAdminDigest: false,
      });
      if (result.evaluated > 0) {
        console.log(
          `[Worker] Conformité : ${result.evaluated} dossier(s), ${result.reminders} relance(s), ${result.expiringMails} alerte(s) expiration.`,
        );
      }
    } catch (error) {
      console.error('[Worker] Erreur audit conformité:', error);
    }
  });

  /** Digest admin hebdomadaire (lundi 8h). */
  cron.schedule('0 8 * * 1', async () => {
    try {
      await service.auditOpenDossiers({ limit: 200, sendAdminDigest: true });
      console.log('[Worker] Digest conformité admin envoyé.');
    } catch (error) {
      console.error('[Worker] Erreur digest conformité:', error);
    }
  });
}
