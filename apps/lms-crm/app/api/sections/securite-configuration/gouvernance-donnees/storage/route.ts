import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { Prisma } from '@repo/database';
import { resolvePreviewKind } from '@/lib/file-asset-service';
import { buildStorageTreeFromKeys } from '@/lib/storage-governance-tree-build';
import {
  applyStorageTreeLabels,
  resolveEntityDisplayNames,
  resolveStorageTreeLabels,
  resolveUserIdsByNameSearch,
} from '@/lib/storage-governance-labels';

async function resolveDossierUsers(q: string) {
  const term = q.trim();
  if (!term) return [];

  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 8,
    select: {
      id: true,
      name: true,
      email: true,
      userCategory: true,
      avatar: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const dossierQ = (sp.get('dossierQ') ?? '').trim();
  const dossierId = (sp.get('dossierId') ?? '').trim();
  const moduleFilter = (sp.get('module') ?? '').trim();
  const prefix = (sp.get('prefix') ?? '').trim().replace(/^\/+|\/+$/g, '');
  const status = (sp.get('status') ?? 'ACTIVE').toUpperCase() as 'ACTIVE' | 'ARCHIVED' | 'ALL';
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const dossierUsers = dossierQ ? await resolveDossierUsers(dossierQ) : [];
  const activeDossierId = dossierId || dossierUsers[0]?.id || '';
  const nameSearchUserIds = q && !activeDossierId ? await resolveUserIdsByNameSearch(prisma, q) : [];

  const where: Prisma.FileAssetWhereInput = {
    deletedAt: null,
    ...(status !== 'ALL' ? { status } : {}),
    ...(moduleFilter ? { module: moduleFilter } : {}),
    ...(prefix
      ? {
          storageKey: { startsWith: `${prefix}/` },
        }
      : {}),
    ...(activeDossierId
      ? {
          OR: [
            { entityId: activeDossierId },
            { storageKey: { contains: activeDossierId } },
            { createdById: activeDossierId },
          ],
        }
      : {}),
    ...(q && !activeDossierId
      ? {
          OR: [
            { originalName: { contains: q, mode: 'insensitive' } },
            { module: { contains: q, mode: 'insensitive' } },
            { entityType: { contains: q, mode: 'insensitive' } },
            { storageKey: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
            ...(nameSearchUserIds.length
              ? [
                  { entityId: { in: nameSearchUserIds } },
                  ...nameSearchUserIds.map((id) => ({
                    storageKey: { contains: id },
                  })),
                ]
              : []),
          ],
        }
      : {}),
  };

  try {
    const baseWhere: Prisma.FileAssetWhereInput = { deletedAt: null };

    const [
      total,
      sumSize,
      rows,
      globalActive,
      globalArchived,
      globalSize,
      moduleGroups,
      allKeys,
      entityFolders,
    ] = await Promise.all([
      prisma.fileAsset.count({ where }),
      prisma.fileAsset.aggregate({ where, _sum: { size: true } }),
      prisma.fileAsset.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { versions: true } },
          currentVersion: { select: { versionNumber: true, status: true } },
        },
      }),
      prisma.fileAsset.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      prisma.fileAsset.count({ where: { ...baseWhere, status: 'ARCHIVED' } }),
      prisma.fileAsset.aggregate({ where: baseWhere, _sum: { size: true } }),
      prisma.fileAsset.groupBy({
        by: ['module'],
        where: { deletedAt: null, status: 'ACTIVE' },
        _count: { id: true },
        _sum: { size: true },
      }),
      prisma.fileAsset.findMany({
        where: baseWhere,
        select: { storageKey: true },
      }),
      prisma.fileAsset.groupBy({
        by: ['entityType', 'entityId'],
        where: {
          ...baseWhere,
          status: 'ACTIVE',
          entityId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
    ]);

    const sizeMb = Math.round((sumSize._sum.size ?? 0) / (1024 * 1024));
    const avgSizeKb = Math.round((sumSize._sum.size ?? 0) / Math.max(total, 1) / 1024);
    const globalSizeMb = Math.round((globalSize._sum.size ?? 0) / (1024 * 1024));
    const rawTree = buildStorageTreeFromKeys(allKeys.map((k) => k.storageKey));
    const labelMap = await resolveStorageTreeLabels(
      prisma,
      rawTree.map((n) => n.prefix),
    );
    const tree = applyStorageTreeLabels(rawTree, labelMap);

    const entityNameMap = await resolveEntityDisplayNames(
      prisma,
      rows.map((r) => r.entityId).filter((id): id is string => !!id),
    );

    const activeDossier = activeDossierId
      ? dossierUsers.find((u) => u.id === activeDossierId) ??
        (await prisma.user.findUnique({
          where: { id: activeDossierId },
          select: {
            id: true,
            name: true,
            email: true,
            userCategory: true,
            avatar: true,
          },
        }))
      : null;

    return ok({
      stats: {
        total,
        sizeMb,
        modules: moduleGroups.length,
        avgSizeKb,
        archived: globalArchived,
        globalActive,
        globalTotal: globalActive + globalArchived,
        globalSizeMb,
        entityDossiers: entityFolders.length,
      },
      tree,
      dossierUsers: dossierUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        userCategory: u.userCategory,
      })),
      activeDossier: activeDossier
        ? {
            id: activeDossier.id,
            name: activeDossier.name,
            email: activeDossier.email,
            userCategory: activeDossier.userCategory,
          }
        : null,
      items: rows.map((r) => ({
        id: r.id,
        originalName: r.originalName,
        module: r.module,
        entityType: r.entityType,
        entityId: r.entityId,
        entityDisplayName: r.entityId ? entityNameMap.get(r.entityId) ?? null : null,
        category: r.category,
        mimeType: r.mimeType,
        size: r.size,
        sizeLabel: `${Math.max(1, Math.round(r.size / 1024))} Ko`,
        url: r.url,
        storageKey: r.storageKey,
        status: r.status,
        legalHold: r.legalHold,
        archivedAt: r.archivedAt?.toISOString() ?? null,
        archiveReason: r.archiveReason,
        versionCount: r._count.versions || 1,
        currentVersion: r.currentVersion?.versionNumber ?? 1,
        previewKind: resolvePreviewKind(r.mimeType),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger le stockage.', 500, e);
  }
}
