import { Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';

function getRhUsersWhere(): Prisma.UserWhereInput {
  return {
    isTrashed: false,
    NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }],
  };
}

function toMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export type RhCollaborateursFlatStats = {
  totalCollaborators: number;
  activeCollaborators: number;
  absentCollaborators: number;
  complianceRate: number;
  complianceIssues: number;
  complianceNonCompliant: number;
  documentsExpiring: number;
  documentsExpired: number;
  categoryDistribution: { name: string; count: number }[];
  monthlyEvolution: { date: string; count: number }[];
};

/** KPIs plats (écrans collaborateurs / formateurs) — filtre optionnel par profil RH. */
export async function getRhCollaborateursFlatStats(
  months: number,
  profileType?: string,
): Promise<RhCollaborateursFlatStats> {
  const baseWhere = getRhUsersWhere();
  const where =
    profileType === 'collaborateur'
      ? { ...baseWhere, role: { slug: 'collaborateur' } }
      : profileType === 'formateur'
        ? { ...baseWhere, role: { slug: 'formateur' } }
        : baseWhere;

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
          OR: [
            { carteProExpiry: { lte: now } },
            { residencePermitExpiry: { lte: now } },
          ],
        },
      }),
    ]);

  const complianceIssues = expiringCount + expiredCount;
  const complianceNonCompliant = expiredCount;
  const complianceRate =
    totalCollaborators > 0
      ? Math.max(0, Math.round(((totalCollaborators - complianceIssues) / totalCollaborators) * 100))
      : 100;

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
    const label = role?.name || role?.slug || 'Autres';
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

  return {
    totalCollaborators,
    activeCollaborators,
    absentCollaborators,
    complianceRate,
    complianceIssues,
    complianceNonCompliant,
    documentsExpiring: expiringCount,
    documentsExpired: expiredCount,
    categoryDistribution,
    monthlyEvolution,
  };
}
