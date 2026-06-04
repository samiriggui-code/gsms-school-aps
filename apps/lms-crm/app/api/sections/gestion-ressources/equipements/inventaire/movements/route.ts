import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import type { StockMovementType } from '@repo/database';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

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
