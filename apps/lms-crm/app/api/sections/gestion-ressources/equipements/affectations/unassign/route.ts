import { NextRequest } from 'next/server';
import { releaseEquipmentFromSession } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../../_lib/require-gestion-ressources-auth';
import { formationSessionRelationInclude } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_session-include';
import { serializeFormationSessionRow } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_serialize-row';

/** Désaffecte une pièce d’une session et la remet en stock si applicable. */
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

    const result = await releaseEquipmentFromSession(prisma, sessionId, equipmentId);
    const session = await prisma.formationSession.findUnique({
      where: { id: sessionId },
      include: formationSessionRelationInclude,
    });

    return ok({
      ...result,
      session: session ? await serializeFormationSessionRow(session) : null,
      equipmentId,
    });
  } catch (error) {
    console.error('[AFFECTATION_UNASSIGN]', error);
    const message = error instanceof Error ? error.message : "Impossible de désaffecter la pièce.";
    return fail(message, 500, error);
  }
}
