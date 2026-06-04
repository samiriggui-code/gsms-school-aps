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
    const roleId = url.searchParams.get('roleId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const userCategory = url.searchParams.get('userCategory') || undefined;

    const where: any = {};
    if (roleId) where.roleId = roleId;
    if (status) where.status = status;
    if (userCategory) where.userCategory = userCategory;

    const [
      total,
      activeCount,
      inactiveCount,
      pendingCount,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.user.count({ where: { ...where, status: 'INACTIVE' } }),
      prisma.user.count({ where: { ...where, status: 'PENDING' } }),
    ]);

    return ok({
      totalConformites: total,
      activeConformites: activeCount,
      inactiveConformites: inactiveCount,
      pendingConformites: pendingCount,
      complianceIssues: inactiveCount + pendingCount,
      complianceNonCompliant: inactiveCount + pendingCount,
      documentsExpiring: 0,
      documentsExpired: 0,
    });
  } catch (error) {
    return fail('Impossible de récupérer les statistiques.', 500, error);
  }
}
