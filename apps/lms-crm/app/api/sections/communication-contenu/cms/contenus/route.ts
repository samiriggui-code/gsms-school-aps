import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FormationLifecycleStatus, Prisma } from '@repo/database';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.FormationWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  try {
    const [total, active, catalogActive, draft, rows] = await Promise.all([
      prisma.formation.count({ where }),
      prisma.formation.count({ where: { ...where, status: FormationLifecycleStatus.ACTIVE } }),
      prisma.formation.count({
        where: { ...where, catalogOffer: { catalogStatus: FormationLifecycleStatus.ACTIVE } },
      }),
      prisma.formation.count({ where: { ...where, status: { not: FormationLifecycleStatus.ACTIVE } } }),
      prisma.formation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          updatedAt: true,
          catalogOffer: { select: { catalogStatus: true } },
        },
      }),
    ]);

    return ok({
      stats: { total, active, catalogActive, draft },
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        status: r.status,
        catalogStatus: r.catalogOffer?.catalogStatus ?? null,
        updatedAt: r.updatedAt.toISOString(),
        editPath: `/gestion-academique/vie-scolaire/formations?formationId=${r.id}`,
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger les contenus.', 500, e);
  }
}
