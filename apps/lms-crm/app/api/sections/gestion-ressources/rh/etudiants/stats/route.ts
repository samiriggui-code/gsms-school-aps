import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  getLearnerScopedWhere,
  parseLearnerRoleSlug,
  toMonthKey,
} from '../../../_lib/rh-learners-shared';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const url = new URL(request.url);
  const months = Math.max(1, Math.min(24, Number(url.searchParams.get('months') || 12)));
  const roleSlug = parseLearnerRoleSlug(url.searchParams.get('roleSlug'));
  const where = getLearnerScopedWhere(roleSlug);

  const now = new Date();
  const expiringThreshold = new Date(now);
  expiringThreshold.setDate(expiringThreshold.getDate() + 30);
  const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [totalCollaborators, activeCollaborators, absentCollaborators, expiringCount, expiredCount] =
    await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.user.count({ where: { ...where, status: 'ABSENT' } }),
      prisma.user.count({
        where: {
          ...where,
          OR: [
            { carteProExpiry: { gt: now, lte: expiringThreshold } },
            { residencePermitExpiry: { gt: now, lte: expiringThreshold } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          ...where,
          OR: [{ carteProExpiry: { lte: now } }, { residencePermitExpiry: { lte: now } }],
        },
      }),
    ]);

  const complianceIssues = expiringCount + expiredCount;
  const usersForDistribution = await prisma.user.findMany({
    where,
    select: { roleId: true, createdAt: true },
  });

  const roleIds = Array.from(new Set(usersForDistribution.map((u) => u.roleId).filter(Boolean)));
  const roles = roleIds.length
    ? await prisma.userRole.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const roleById = new Map(roles.map((r) => [r.id, r]));

  const distributionMap = new Map<string, number>();
  for (const user of usersForDistribution) {
    const role = roleById.get(user.roleId);
    const label = role?.name || role?.slug || 'Élève';
    distributionMap.set(label, (distributionMap.get(label) || 0) + 1);
  }
  const categoryDistribution = Array.from(distributionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const monthlyCreatedMap = new Map<string, number>();
  for (const user of usersForDistribution) {
    if (user.createdAt >= timelineStart) {
      const key = toMonthKey(user.createdAt);
      monthlyCreatedMap.set(key, (monthlyCreatedMap.get(key) || 0) + 1);
    }
  }

  const monthlyEvolution: { date: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toMonthKey(d);
    monthlyEvolution.push({
      date: d.toISOString(),
      count: monthlyCreatedMap.get(key) || 0,
    });
  }

  return ok({
    totalCollaborators,
    activeCollaborators,
    absentCollaborators,
    complianceIssues,
    complianceNonCompliant: expiredCount,
    documentsExpiring: expiringCount,
    documentsExpired: expiredCount,
    categoryDistribution,
    monthlyEvolution,
    complianceRate:
      totalCollaborators > 0
        ? Math.max(0, Math.round(((totalCollaborators - complianceIssues) / totalCollaborators) * 100))
        : 100,
  });
}
