import { NextRequest } from 'next/server';
import { completeEquipmentMaintenanceForUnit } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ id: string }> };

/** Clôture l’intervention ouverte d’une pièce (crée la fiche si absente). */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id: equipmentId } = await params;
  if (!equipmentId) return fail('ID équipement requis.', 400);

  let notes: string | null | undefined;
  let outcome: 'restock' | 'out_of_service' | undefined;
  try {
    const body = await request.json();
    notes = body?.notes !== undefined ? String(body.notes || '').trim() || null : undefined;
    if (body?.outcome === 'out_of_service' || body?.outcome === 'restock') {
      outcome = body.outcome;
    }
  } catch {
    notes = undefined;
  }

  try {
    const item = await completeEquipmentMaintenanceForUnit(prisma, equipmentId, { notes, outcome });
    return ok({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clôture impossible.';
    const status = message.includes('introuvable')
      ? 404
      : message.includes('pas en maintenance') || message.includes('déjà')
        ? 409
        : 500;
    return fail(message, status, error);
  }
}
