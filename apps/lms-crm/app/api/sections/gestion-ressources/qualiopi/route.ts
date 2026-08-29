import { ComplianceService } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../_lib/require-gestion-ressources-auth';
import { QUALIOPI_SCHOOL_SUBJECT_ID } from '@/lib/of/qualiopi-indicators';
import { ensureQualiopiSchoolTemplate } from '@/lib/of/ensure-qualiopi-template';

/**
 * Amorce (si absent) puis retourne le dossier Qualiopi école + items — GSMS-OF-05.
 * Route section Gestion ressources (ressourcesView).
 */
export async function GET() {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    await ensureQualiopiSchoolTemplate();

    const service = new ComplianceService(prisma);
    const dossier = await service.ensureDossier({
      kind: 'SCHOOL_QUALIOPI',
      subjectType: 'SCHOOL',
      subjectId: QUALIOPI_SCHOOL_SUBJECT_ID,
    });
    const summary = await service.getDossierSummary(dossier.id);

    const items = await prisma.complianceDossierItem.findMany({
      where: { dossierId: dossier.id },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        label: true,
        status: true,
        fileCategory: true,
        fileAssetId: true,
        rejectionReason: true,
        fileAsset: { select: { id: true, url: true, originalName: true } },
      },
    });

    return ok({ dossierId: dossier.id, summary, items });
  } catch (e) {
    console.error('[qualiopi GET]', e);
    return fail('Impossible de charger le dossier Qualiopi.', 500, e);
  }
}
