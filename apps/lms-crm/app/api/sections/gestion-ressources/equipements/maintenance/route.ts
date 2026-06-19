import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../_lib/require-gestion-ressources-auth';

/** Liste globale des interventions (records `EquipmentMaintenance`). */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 50)));
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const skip = (page - 1) * limit;
    const openOnly = url.searchParams.get('open') === '1';

    const where = openOnly
      ? { status: { in: ['SCHEDULED', 'IN_PROGRESS', 'OVERDUE'] } }
      : {};

    const [rows, total] = await Promise.all([
      prisma.equipmentMaintenance.findMany({
        where,
        take: limit,
        skip,
        orderBy: { scheduledDate: 'desc' },
        include: {
          equipment: {
            select: {
              id: true,
              label: true,
              serialNumber: true,
              status: true,
            },
          },
        },
      }),
      prisma.equipmentMaintenance.count({ where }),
    ]);

    return ok({
      data: rows.map((row) => ({
        id: row.id,
        type: row.title ?? 'Intervention',
        title: row.title,
        status: row.status,
        scheduledDate: row.scheduledDate?.toISOString() ?? null,
        completedDate: row.completedDate?.toISOString() ?? null,
        equipmentId: row.equipmentId,
        equipmentLabel: row.equipment.label,
        equipmentSerial: row.equipment.serialNumber,
        equipmentStatus: row.equipment.status,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return fail('Impossible de charger les interventions.', 500, error);
  }
}
