import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../../../../_lib/require-gestion-ressources-auth';
import { buildRhCollaborateurCompliancePayload } from '@/lib/gestion-ressources/rh-user-compliance-rows';

/**
 * GET /api/sections/gestion-ressources/rh/collaborateurs/[id]/compliance
 *
 * Lignes documentaires RH (User + FileAsset GED) pour la DataGrid conformité fiche collaborateur.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const [user, fileAssets, events] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userCategory: true,
          qualification: true,
          carteProNumber: true,
          carteProExpiry: true,
          documentCni: true,
          documentAssurance: true,
          documentCartePro: true,
          documentResidencePermit: true,
          residencePermitExpiry: true,
          role: { select: { slug: true } },
        },
      }),

      prisma.fileAsset.findMany({
        where: {
          module: 'crm',
          entityType: 'collaborateur',
          entityId: id,
          status: 'ACTIVE',
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          category: true,
          originalName: true,
          url: true,
          issuedAt: true,
          expiresAt: true,
          issuedBy: true,
          documentRef: true,
        },
      }),

      prisma.complianceItemEvent.findMany({
        where: {
          dossier: { userId: id },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
          dossierItem: { select: { code: true, label: true } },
        },
      }),
    ]);

    if (!user) return fail('Collaborateur non trouvé', 404);

    const payload = buildRhCollaborateurCompliancePayload(user, fileAssets);

    return ok({
      ...payload,
      events,
    });
  } catch (e) {
    return fail('Impossible de charger la conformité.', 500, e);
  }
}
