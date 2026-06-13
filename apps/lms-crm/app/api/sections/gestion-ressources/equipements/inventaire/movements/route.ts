import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import type { StockMovementType } from '@repo/database';

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as StockMovementType | null;
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 50)));

    const movements = await prisma.stockMovement.findMany({
      where: type ? { type } : undefined,
      include: {
        equipment: {
          select: {
            label: true,
            serialNumber: true,
          }
        }
      },
      orderBy: {
        movementDate: 'desc'
      },
      take: limit
    });

    return ok(movements);
  } catch (error) {
    return fail('Impossible de recuperer les mouvements de stock.', 500, error);
  }
}
