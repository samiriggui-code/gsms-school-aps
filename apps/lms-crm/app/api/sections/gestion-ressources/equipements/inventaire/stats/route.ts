import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || undefined;

    const where: any = {};
    if (query) {
      where.OR = [
        { label: { contains: query, mode: 'insensitive' } },
        { serialNumber: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [totalItems, activeItems, maintenanceItems] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.count({ where: { ...where, status: 'AVAILABLE' } }),
      prisma.equipment.count({ where: { ...where, status: 'MAINTENANCE' } }),
    ]);

    return ok({
      totalItems,
      activeItems,
      complianceIssues: maintenanceItems,
      complianceNonCompliant: 0,
      controlsExpiring: 0,
      controlsExpired: 0,
    });
  } catch (error) {
    return fail('Impossible de récupérer les statistiques.', 500, error);
  }
}