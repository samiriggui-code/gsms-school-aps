import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { evaluateRhUserCompliance } from '@/lib/gestion-ressources/rh-conformite-compliance';
import { requireGestionRessourcesEdit, requireGestionRessourcesView } from '../../../_lib/require-gestion-ressources-auth';
import { PATCH as patchCollaborateur } from '../../collaborateurs/[[...path]]/route';
import { mapRhConformiteListRow } from '@/lib/gestion-ressources/rh-conformite-compliance';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        userCategory: true,
        qualification: true,
        carteProNumber: true,
        carteProExpiry: true,
        documentCni: true,
        documentAssurance: true,
        documentCartePro: true,
        documentResidencePermit: true,
        birthDate: true,
        residencePermitExpiry: true,
        role: { select: { slug: true } },
      },
    });

    if (!user) return fail('Conformité non trouvée', 404);

    return ok(evaluateRhUserCompliance(user));
  } catch (error) {
    return fail('Impossible de récupérer la conformité.', 500, error);
  }
}

/** Délègue au handler collaborateur (FormData + FileAsset). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await patchCollaborateur(request, { params: Promise.resolve({ path: [id] }) });
  if (!res.ok) return res;

  try {
    const body = await res.clone().json();
    const user = body?.data ?? body;
    if (user?.id) {
      return ok(mapRhConformiteListRow(user));
    }
    return res;
  } catch {
    return res;
  }
}

/** Réintégration (restauration) d'un profil archivé — POST sur /conformite/:id. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE', isTrashed: false },
      include: { role: true },
    });

    return ok(mapRhConformiteListRow(updatedUser));
  } catch (error) {
    return fail('Impossible de réintégrer le conformité.', 500, error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await prisma.user.update({
      where: { id },
      data: { isTrashed: true, status: 'INACTIVE' },
    });
    return ok({ message: 'Conformité supprimée avec succès' });
  } catch (error) {
    return fail('Impossible de supprimer la conformité.', 500, error);
  }
}
