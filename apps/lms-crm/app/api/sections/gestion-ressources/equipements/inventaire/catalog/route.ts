import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../_lib/require-gestion-ressources-auth';
import { deleteCatalogByLabel } from '../_lib/equipment-delete';

/** Supprime toutes les unités d’une catégorie catalogue (même `label`). */
export async function DELETE(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as { label?: string };
    const label = String(body.label ?? '').trim();
    if (!label) return fail('Libellé catalogue requis.', 400);

    const result = await deleteCatalogByLabel(prisma, label);
    return ok({
      message: `${result.deletedCount} pièce(s) supprimée(s) pour « ${label} ».`,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Suppression impossible.';
    const status = message.includes('introuvable') ? 404 : message.includes('session') ? 422 : 500;
    return fail(message, status, error);
  }
}
