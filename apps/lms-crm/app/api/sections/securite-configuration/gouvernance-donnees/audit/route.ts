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

  const where: Prisma.SystemLogWhereInput = q
    ? {
        OR: [
          { event: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
        ],
      }
    : {};

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const [total, recent, loginCount, today, rows] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
      prisma.systemLog.count({ where: { event: { contains: 'LOGIN', mode: 'insensitive' } } }),
      prisma.systemLog.count({ where: { ...where, createdAt: { gte: todayStart } } }),
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          event: true,
          description: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
        },
      }),
    ]);

    return ok({
      stats: { total, recent, loginCount, today, ipCount: new Set(rows.map((r) => r.ipAddress).filter(Boolean)).size },
      items: rows.map((r) => ({
        id: r.id,
        event: r.event,
        description: (r.description ?? '—').slice(0, 120),
        user: r.user?.name ?? r.user?.email ?? '—',
        ipAddress: r.ipAddress ?? '—',
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger le journal.', 500, e);
  }
}
