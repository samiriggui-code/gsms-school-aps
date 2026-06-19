import { NextRequest } from 'next/server';
import type { EquipmentStatus } from '@repo/database';
import { ensureOpenMaintenanceRecord } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../_lib/require-gestion-ressources-auth';
import { deleteCatalogByLabel } from '../_lib/equipment-delete';

const BULK_STATUSES: EquipmentStatus[] = [
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
];

/** Actions groupées sur le catalogue inventaire. */
export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      action?: string;
      labels?: string[];
      status?: string;
    };

    const labels = (body.labels ?? [])
      .map((l) => String(l).trim())
      .filter(Boolean);
    if (labels.length === 0) return fail('Aucune catégorie sélectionnée.', 400);

    if (body.action === 'delete-catalog') {
      let deletedCount = 0;
      for (const label of labels) {
        const result = await deleteCatalogByLabel(prisma, label);
        deletedCount += result.deletedCount;
      }
      return ok({
        action: 'delete-catalog',
        deletedCount,
        message: `${deletedCount} pièce(s) supprimée(s).`,
      });
    }

    if (body.action === 'set-status-by-label') {
      const status = String(body.status ?? '').toUpperCase() as EquipmentStatus;
      if (!BULK_STATUSES.includes(status)) {
        return fail('Statut invalide.', 400);
      }
      const result = await prisma.equipment.updateMany({
        where: { label: { in: labels } },
        data: { status },
      });

      if (status === 'MAINTENANCE') {
        const units = await prisma.equipment.findMany({
          where: { label: { in: labels } },
          select: { id: true },
        });
        for (const unit of units) {
          await ensureOpenMaintenanceRecord(prisma, unit.id);
        }
      }

      return ok({
        action: 'set-status-by-label',
        updatedCount: result.count,
        status,
      });
    }

    return fail('Action inconnue.', 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action groupée impossible.';
    return fail(message, message.includes('session') ? 422 : 500, error);
  }
}
