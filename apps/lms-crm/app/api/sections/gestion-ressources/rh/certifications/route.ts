import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

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
