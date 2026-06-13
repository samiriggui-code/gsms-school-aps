import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const equipments = await prisma.equipment.findMany({
      include: {
        assignedSite: true,
        maintenanceItems: {
          where: {
            status: 'IN_PROGRESS'
          }
        },
        stockMovements: true
      }
    });

    const summary = equipments.map(e => {
      const stockIn = e.stockMovements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + m.quantity, 0);
      const stockOut = e.stockMovements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const totalUnits = stockIn; // Ce qu'on a acheté
      const totalOut = stockOut; // Ce qui est sorti (pour session ou autre)
      const currentStock = stockIn - stockOut; // Ce qu'on a physiquement
      
      const maintenanceUnits = e.maintenanceItems.length; // Nombre d'unités en maintenance
      
      // Disponibilité réelle = Stock Physique - Unités en maintenance
      const availableUnits = Math.max(0, currentStock - maintenanceUnits);
      
      return {
        id: e.id,
        label: e.label,
        serialNumber: e.serialNumber,
        type: e.type,
        avatar: e.avatar,
        assignedSite: e.assignedSite,
        stockStats: {
          totalIn: stockIn,
          totalOut: stockOut,
          currentStock: currentStock,
          maintenance: maintenanceUnits,
          available: availableUnits
        },
        updatedAt: e.updatedAt
      };
    });

    return ok({
      items: summary,
      pagination: {
        total: summary.length,
        page: 1,
        limit: summary.length
      }
    });
  } catch (error) {
    console.error('[STOCK_SUMMARY_GET]', error);
    return fail('Impossible de recuperer le résumé des stocks.', 500, error);
  }
}
