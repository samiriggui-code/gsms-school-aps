import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { MarketingCampaignStatus, Prisma } from '@repo/database';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.MarketingCampaignWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { channel: { contains: q, mode: 'insensitive' } },
          { utmSource: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  try {
    const [total, active, paused, ended, draft, rows] = await Promise.all([
      prisma.marketingCampaign.count({ where }),
      prisma.marketingCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.marketingCampaign.count({ where: { status: 'PAUSED' } }),
      prisma.marketingCampaign.count({ where: { status: 'ENDED' } }),
      prisma.marketingCampaign.count({ where: { status: 'DRAFT' } }),
      prisma.marketingCampaign.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return ok({
      stats: { total, active, paused, ended, draft },
      items: rows.map((r) => ({
        ...r,
        startDate: r.startDate?.toISOString() ?? null,
        endDate: r.endDate?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger les campagnes.', 500, e);
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

  const name = String(body.name ?? '').trim();
  if (!name) return fail('Nom requis.', 400);

  const status = String(body.status ?? 'DRAFT').trim() as MarketingCampaignStatus;

  try {
    const row = await prisma.marketingCampaign.create({
      data: {
        name,
        channel: String(body.channel ?? 'landing').trim() || 'landing',
        status: Object.values(MarketingCampaignStatus).includes(status) ? status : 'DRAFT',
        utmSource: String(body.utmSource ?? '').trim() || null,
        utmMedium: String(body.utmMedium ?? '').trim() || null,
        utmCampaign: String(body.utmCampaign ?? '').trim() || null,
        notes: String(body.notes ?? '').trim() || null,
      },
    });
    return ok({ id: row.id }, 201);
  } catch (e) {
    return fail('Création impossible.', 500, e);
  }
}
