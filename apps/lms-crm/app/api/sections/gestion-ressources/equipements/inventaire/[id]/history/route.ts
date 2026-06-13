import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../../../../_lib/require-gestion-ressources-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return fail('ID manquant', 400);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 20)));
  const skip = (page - 1) * limit;

  try {
    // On récupère les mouvements de stock comme source d'historique primaire
    // On pourrait aussi joindre SystemLog si besoin
    const movements = await prisma.$queryRaw<any[]>`
      SELECT * FROM "StockMovement"
      WHERE "equipmentId" = ${id}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const totalCountResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "StockMovement"
      WHERE "equipmentId" = ${id}
    `;

    const total = Number(totalCountResult[0]?.count || 0);

    // Formater les mouvements en entrées d'historique pour le frontend
    const entries = movements.map(m => ({
      id: m.id,
      action: m.type === 'IN' ? 'create' : 'update', // On mappe les types pour le visuel
      label: m.type === 'IN' ? 'Entrée en stock' : m.type === 'OUT' ? 'Sortie de stock' : 'Transfert',
      description: m.notes || 'Aucun détail fourni',
      createdAt: m.createdAt,
      actor: null // Pas d'acteur dans StockMovement pour l'instant
    }));

    return ok({
      data: entries,
      summary: {
        total,
        createCount: movements.filter(m => m.type === 'IN').length,
        updateCount: movements.filter(m => m.type !== 'IN').length,
        deleteCount: 0
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return fail('Impossible de récupérer l’historique.', 500, error);
  }
}
