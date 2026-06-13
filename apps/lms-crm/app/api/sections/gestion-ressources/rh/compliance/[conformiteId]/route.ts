import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { evaluateRhUserCompliance } from '@/lib/gestion-ressources/rh-conformite-compliance';
import { requireGestionRessourcesView } from '../../../_lib/require-gestion-ressources-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conformiteId: string }> },
) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { conformiteId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: conformiteId },
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
