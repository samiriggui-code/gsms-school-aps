import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { formationSessionRelationInclude } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_session-include';
import { serializeFormationSessionRow } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_serialize-row';

function normalizeEquipmentIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeEquipmentIds(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

/** Réserve une pièce (unité) sur une session FormationSession. */
export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const equipmentId = String(body.equipmentId || '').trim();
    const sessionId = String(body.sessionId || '').trim();

    if (!equipmentId || !sessionId) {
      return fail('Pièce et session sont obligatoires.', 400);
    }

    const [equipment, formationSession] = await Promise.all([
      prisma.equipment.findUnique({ where: { id: equipmentId } }),
      prisma.formationSession.findUnique({
        where: { id: sessionId },
        include: formationSessionRelationInclude,
      }),
    ]);

    if (!equipment) return fail('Équipement introuvable.', 404);
    if (!formationSession) return fail('Session introuvable.', 404);

    if (equipment.status !== 'AVAILABLE') {
      return fail(
        `La pièce n'est pas disponible (statut : ${equipment.status}).`,
        409,
      );
    }

    const currentIds = normalizeEquipmentIds(formationSession.reservedEquipmentIds);
    if (currentIds.includes(equipmentId)) {
      return fail('Cette pièce est déjà affectée à cette session.', 409);
    }

    const nextIds = [...currentIds, equipmentId];

    const updated = await prisma.formationSession.update({
      where: { id: sessionId },
      data: {
        reservedEquipmentIds: nextIds as unknown as object,
      },
      include: formationSessionRelationInclude,
    });

    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'IN_USE' },
    });

    const item = await serializeFormationSessionRow(updated);

    return ok({
      session: item,
      equipmentId,
    });
  } catch (error) {
    console.error('[AFFECTATION_ASSIGN]', error);
    return fail("Impossible d'affecter la pièce à la session.", 500, error);
  }
}
