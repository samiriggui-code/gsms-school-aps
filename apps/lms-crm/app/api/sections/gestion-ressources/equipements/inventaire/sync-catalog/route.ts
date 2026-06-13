import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { isLegacyEquipmentClone } from '@/lib/equipment-catalog';

/** Propage libellé, type, métadonnées et photo sur toutes les pièces d'une catégorie. */
export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const fromLabel = String(body.fromLabel || '').trim();
    if (!fromLabel) return fail('Libellé catégorie source manquant.', 400);

    const newLabel = body.label != null ? String(body.label).trim() : undefined;
    const type = body.type != null ? String(body.type) : undefined;
    const metadataPatch =
      body.metadata && typeof body.metadata === 'object' ? (body.metadata as Record<string, unknown>) : null;
    const avatarUrl = body.avatarUrl != null ? String(body.avatarUrl) : undefined;

    const units = await prisma.equipment.findMany({
      where: { label: fromLabel },
    });

    const targets = units.filter((u) => !isLegacyEquipmentClone(u.serialNumber));
    if (targets.length === 0) return fail('Aucune pièce trouvée pour cette catégorie.', 404);

    let updated = 0;
    for (const unit of targets) {
      const currentMeta = (unit.metadata as Record<string, unknown> | null) ?? {};
      const nextMeta = metadataPatch
        ? { ...currentMeta, ...metadataPatch }
        : { ...currentMeta };
      if (avatarUrl) {
        nextMeta.avatar = avatarUrl;
      }

      await prisma.equipment.update({
        where: { id: unit.id },
        data: {
          ...(newLabel ? { label: newLabel } : {}),
          ...(type ? { type } : {}),
          metadata: nextMeta as any,
          ...(avatarUrl ? { avatar: avatarUrl } : {}),
        },
      });
      updated += 1;
    }

    return ok({
      updated,
      catalogLabel: newLabel ?? fromLabel,
    });
  } catch (error) {
    console.error('[SYNC_CATALOG]', error);
    return fail('Impossible de synchroniser la catégorie.', 500, error);
  }
}
