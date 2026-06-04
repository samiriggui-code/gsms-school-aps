import cron from 'node-cron';
import { PrismaClient } from '@repo/database';
import { StatService } from '@repo/api-core';

/**
 * Ce worker simule une agrégation régulière des statistiques
 * en pré-remplissant le cache Redis toutes les heures.
 */
export function setupStatsAggregation(prisma: PrismaClient) {
  const statService = new StatService(prisma);

  // Exécution toutes les heures
  cron.schedule('0 * * * *', async () => {
    console.log('[Worker] Démarrage de l\'agrégation des statistiques...');
    
    try {
      // Pré-calcul et mise en cache des modules principaux
      await Promise.all([
        statService.getCandidatsStats(12),
        statService.getCollaborateursStats(12),
        statService.getVieScolaireStats(12),
        statService.getEquipementsStats(30),
        statService.getFinanceStats(),
        statService.getGeneralDashboardStats(),
        statService.getSupportQualiteStats(),
        statService.getSecurityStats(),
      ]);
      
      console.log('[Worker] Agrégation terminée avec succès.');
    } catch (error) {
      console.error('[Worker] Erreur lors de l\'agrégation des stats:', error);
    }
  });
}
