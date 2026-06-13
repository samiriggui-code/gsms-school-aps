import { prisma } from '@/lib/prisma';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { StatService } from '@repo/api-core';

export async function GET() {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const stats = await new StatService(prisma).getRhCertificationsStats();
    return ok({ stats });
  } catch (error) {
    return fail('Impossible de charger les statistiques certifications.', 500, error);
  }
}
