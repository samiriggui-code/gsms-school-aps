import { NextRequest } from 'next/server';
import { releaseEndedSessionsEquipment } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../../_lib/require-gestion-ressources-auth';

/** Libère le matériel des sessions terminées (retour stock + JSON vidé). */
export async function POST(_request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const result = await releaseEndedSessionsEquipment(prisma, { notifySource: 'manual' });
    return ok({
      ...result,
      message: `${result.equipmentReleased} pièce(s) remise(s) en stock sur ${result.sessionsCleared} session(s) clôturée(s).`,
    });
  } catch (error) {
    return fail('Libération impossible.', 500, error);
  }
}
