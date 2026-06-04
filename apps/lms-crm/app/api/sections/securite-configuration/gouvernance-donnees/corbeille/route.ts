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
    deletedAt: { not: null },
    ...(q ? { originalName: { contains: q, mode: 'insensitive' } } : {}),
  };

  try {
    const [total, trashedUsers, rows] = await Promise.all([
      prisma.fileAsset.count({ where }),
      prisma.user.count({ where: { isTrashed: true } }),
      prisma.fileAsset.findMany({
        where,
        orderBy: { deletedAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, originalName: true, module: true, deletedAt: true },
      }),
    ]);

    return ok({
      stats: { total, trashedUsers, volumeTotal: total + trashedUsers, retentionDays: 90, restoreCount: 0 },
      items: rows.map((r) => ({
        id: r.id,
        originalName: r.originalName,
        module: r.module,
        deletedAt: r.deletedAt ? new Date(r.deletedAt).toLocaleString('fr-FR') : null,
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger la corbeille.', 500, e);
  }
}
