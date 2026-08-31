import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildQualiopiCoverageGaps } from '@/lib/of/qualiopi-gaps';
import { requireGestionRessourcesView } from '../../../_lib/require-gestion-ressources-auth';

/** GET — AI-04 P0 : gaps couverture Qualiopi (déterministe, lecture seule). */
export async function GET() {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const data = await buildQualiopiCoverageGaps(prisma);
    return ok(data);
  } catch (e) {
    console.error('[qualiopi/gaps] GET', e);
    return fail('Failed to compute Qualiopi gaps', 500);
  }
}
