import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../../../_lib/require-gestion-ressources-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail('ID manquant', 400);

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Number(url.searchParams.get('limit') || 10));
  const skip = (page - 1) * limit;

  try {
    const [rows, totalCount] = await Promise.all([
      prisma.equipmentMaintenance.findMany({
        where: { equipmentId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.equipmentMaintenance.count({ where: { equipmentId: id } }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      type: row.title || 'Intervention',
      status: row.status,
      description: row.notes,
      startDate: row.scheduledDate?.toISOString() ?? row.createdAt.toISOString(),
      endDate: row.completedDate?.toISOString() ?? null,
      cost: null,
      technician: null,
    }));

    return ok({
      data,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    return fail('Impossible de récupérer la maintenance.', 500, error);
  }
}

/** Ouvre une intervention et passe la pièce en statut MAINTENANCE. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id: equipmentId } = await params;
  if (!equipmentId) return fail('ID manquant', 400);

  try {
    const body = await request.json();
    const title = String(body.title || 'Intervention atelier').trim();
    const notes = body.notes ? String(body.notes).trim() : null;
    const scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;

    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) return fail('Équipement introuvable.', 404);
    if (equipment.status === 'MAINTENANCE') {
      return fail('Cette pièce est déjà en maintenance.', 409);
    }

    const item = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.equipmentMaintenance.create({
        data: {
          equipmentId,
          title,
          notes,
          scheduledDate,
          status: 'SCHEDULED',
        },
      });
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: 'MAINTENANCE' },
      });
      return maintenance;
    });

    return ok({ item });
  } catch (error) {
    console.error('[MAINTENANCE_CREATE]', error);
    return fail("Impossible d'ouvrir l'intervention.", 500, error);
  }
}
