import { ComplianceService } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireSupportView } from '../_lib/require-support-auth';
import { QUALIOPI_SCHOOL_SUBJECT_ID } from '@/lib/of/qualiopi-indicators';

/** Amorce (si absent) puis retourne le dossier Qualiopi école — GSMS-OF-05. */
export async function GET() {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  try {
    const service = new ComplianceService(prisma);
    const dossier = await service.ensureDossier({
      kind: 'SCHOOL_QUALIOPI',
      subjectType: 'SCHOOL',
      subjectId: QUALIOPI_SCHOOL_SUBJECT_ID,
    });
    const summary = await service.getDossierSummary(dossier.id);
    return ok({ dossierId: dossier.id, summary });
  } catch (e) {
    return fail('Impossible de charger le dossier Qualiopi.', 500, e);
  }
}
