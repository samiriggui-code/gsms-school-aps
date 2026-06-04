import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { Prisma } from '@repo/database';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.FileAssetWhereInput = {
    deletedAt: null,
    status: 'ACTIVE',
    ...(q
      ? {
          OR: [
            { originalName: { contains: q, mode: 'insensitive' } },
            { module: { contains: q, mode: 'insensitive' } },
            { entityType: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const [total, sumSize, rows] = await Promise.all([
      prisma.fileAsset.count({ where }),
      prisma.fileAsset.aggregate({ where, _sum: { size: true } }),
      prisma.fileAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          originalName: true,
          module: true,
          entityType: true,
          mimeType: true,
          size: true,
          url: true,
          createdAt: true,
        },
      }),
    ]);

    const sizeMb = Math.round((sumSize._sum.size ?? 0) / (1024 * 1024));
    const avgSizeKb = Math.round((sumSize._sum.size ?? 0) / Math.max(total, 1) / 1024);
    const entityTypes = new Set(rows.map((r) => r.entityType)).size;

    return ok({
      stats: {
        total,
        sizeMb,
        modules: new Set(rows.map((r) => r.module)).size,
        avgSizeKb,
        entityTypes,
      },
      items: rows.map((r) => ({
        id: r.id,
        originalName: r.originalName,
        module: r.module,
        entityType: r.entityType,
        mimeType: r.mimeType,
        sizeLabel: `${Math.max(1, Math.round(r.size / 1024))} Ko`,
        url: r.url,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger le stockage.', 500, e);
  }
}
