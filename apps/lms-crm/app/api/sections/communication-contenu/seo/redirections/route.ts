import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { Prisma } from '@repo/database';
import { invalidateLandingSeoRedirectCache } from '@/lib/seo-redirect-cache';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.SeoRedirectWhereInput = q
    ? {
        OR: [
          { sourcePath: { contains: q, mode: 'insensitive' } },
          { targetPath: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  try {
    const [total, active, perm301, perm302, rows] = await Promise.all([
      prisma.seoRedirect.count({ where }),
      prisma.seoRedirect.count({ where: { active: true } }),
      prisma.seoRedirect.count({ where: { redirectType: 301 } }),
      prisma.seoRedirect.count({ where: { redirectType: 302 } }),
      prisma.seoRedirect.findMany({ where, orderBy: { sourcePath: 'asc' }, skip, take: limit }),
    ]);

    return ok({
      stats: { total, active, inactive: total - active, perm301, perm302 },
      items: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger les redirections.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const sourcePath = String(body.sourcePath ?? '').trim();
  const targetPath = String(body.targetPath ?? '').trim();
  if (!sourcePath.startsWith('/') || !targetPath) {
    return fail('Source (/) et cible requises.', 400);
  }

  try {
    const row = await prisma.seoRedirect.create({
      data: {
        sourcePath,
        targetPath,
        redirectType: Number(body.redirectType) === 301 ? 301 : 302,
        active: body.active !== false,
        notes: String(body.notes ?? '').trim() || null,
      },
    });
    await invalidateLandingSeoRedirectCache(sourcePath);
    return ok({ id: row.id }, 201);
  } catch (e) {
    return fail('Création impossible (source déjà utilisée ?).', 500, e);
  }
}
