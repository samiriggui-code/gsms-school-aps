import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CandidatureStatus } from '@repo/database';
import {
  buildGedDossierPath,
  formatMissingDocumentsLabel,
  listMissingCandidatDocuments,
} from '@/lib/governance/candidat-missing-documents';

const OPEN_CANDIDATURE_STATUSES: CandidatureStatus[] = [
  CandidatureStatus.DRAFT,
  CandidatureStatus.SUBMITTED,
  CandidatureStatus.MISSING_DOCUMENTS,
  CandidatureStatus.VALIDATION_PENDING,
];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const now = new Date();
    const timelineStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      filesActive,
      filesArchived,
      filesTrashed,
      sizeAgg,
      entityDossiers,
      openDemandes,
      missingStatusDemandes,
      moduleGroups,
      uploadRows,
      recentCandidatures,
    ] = await Promise.all([
      prisma.fileAsset.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.fileAsset.count({ where: { deletedAt: null, status: 'ARCHIVED' } }),
      prisma.fileAsset.count({ where: { deletedAt: { not: null } } }),
      prisma.fileAsset.aggregate({
        where: { deletedAt: null },
        _sum: { size: true },
      }),
      prisma.fileAsset.groupBy({
        by: ['entityId'],
        where: { deletedAt: null, status: 'ACTIVE', entityId: { not: null } },
      }),
      prisma.candidature.count({
        where: { status: { in: OPEN_CANDIDATURE_STATUSES } },
      }),
      prisma.candidature.count({
        where: { status: CandidatureStatus.MISSING_DOCUMENTS },
      }),
      prisma.fileAsset.groupBy({
        by: ['module'],
        where: { deletedAt: null, status: 'ACTIVE' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      prisma.fileAsset.findMany({
        where: { deletedAt: null, createdAt: { gte: timelineStart } },
        select: { createdAt: true },
      }),
      prisma.candidature.findMany({
        where: {
          status: {
            in: [CandidatureStatus.MISSING_DOCUMENTS, CandidatureStatus.VALIDATION_PENDING],
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
              documentCni: true,
              documentAssurance: true,
              documentResidencePermit: true,
              documentCartePro: true,
              avatar: true,
              residencePermitNumber: true,
            },
          },
          formation: { select: { name: true } },
        },
      }),
    ]);

    const volumeMb = Math.round((sizeAgg._sum.size ?? 0) / (1024 * 1024));
    const monthMap = new Map<string, number>();
    for (const row of uploadRows) {
      const key = monthKey(row.createdAt);
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }

    const monthlyUploads: { date: string; count: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      monthlyUploads.push({ date: d.toISOString(), count: monthMap.get(key) ?? 0 });
    }

    const moduleDistribution = moduleGroups.map((g) => ({
      name: g.module,
      count: g._count.id,
    }));

    const demandesAlerts = recentCandidatures.map((row) => {
      const displayName =
        `${row.user.firstName ?? ''} ${row.user.lastName ?? ''}`.trim() ||
        row.user.name ||
        row.user.email;
      const missing = listMissingCandidatDocuments(row.user);
      return {
        id: row.id,
        userId: row.user.id,
        candidat: displayName,
        formation: row.formation?.name ?? '—',
        status: row.status,
        missingPieces: formatMissingDocumentsLabel(missing),
        missingCount: missing.length,
        updatedAt: row.updatedAt.toISOString(),
        editPath: `/gestion-academique/vie-scolaire/etudiants?candidatureId=${row.id}`,
        gedPath: buildGedDossierPath(row.user.id, displayName),
        demandesPath: '/securite-configuration/gouvernance-donnees/demandes-documents',
      };
    });

    return ok({
      stats: {
        filesActive,
        filesArchived,
        filesTrashed,
        volumeMb,
        entityDossiers: entityDossiers.length,
        openDemandes,
        missingDocumentsDemandes: missingStatusDemandes,
      },
      monthlyUploads,
      moduleDistribution,
      demandesAlerts,
    });
  } catch (e) {
    return fail('Impossible de charger le tableau de bord gouvernance.', 500, e);
  }
}
