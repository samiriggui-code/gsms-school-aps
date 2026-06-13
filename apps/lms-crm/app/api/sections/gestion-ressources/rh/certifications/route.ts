import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const userCertificates = await prisma.userCertificate.findMany({
      where,
      include: {
        certification: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    // Map to expected interface: { id, type, level?, obtainedDate, expiryDate?, status, nextRecyclageDate? }
    const mapped = userCertificates.map((uc) => ({
      id: uc.id,
      type: uc.certification?.course?.title || 'Certification',
      level: null,
      obtainedDate: uc.issueDate.toISOString(),
      expiryDate: uc.expiryDate ? uc.expiryDate.toISOString() : null,
      status: 'ACTIVE',
      nextRecyclageDate: null,
    }));

    return ok(mapped);
  } catch (error) {
    return fail('Impossible de récupérer les certifications.', 500, error);
  }
}
