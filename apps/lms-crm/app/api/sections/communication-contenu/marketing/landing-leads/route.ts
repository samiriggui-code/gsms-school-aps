import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import {
  LANDING_LEAD_SOURCES,
  LANDING_PREINSCRIPTION_LEAD_SOURCE,
  LANDING_QUOTE_LEAD_SOURCE,
} from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { Prisma } from '@repo/database';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.communicationView)) {
    return fail('Forbidden', 403);
  }

  const sp = request.nextUrl.searchParams;
  const kind = sp.get('kind') ?? 'all';
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const baseWhere: Prisma.LeadWhereInput = {
    source:
      kind === 'quote'
        ? { equals: LANDING_QUOTE_LEAD_SOURCE }
        : kind === 'preinscription'
          ? { equals: LANDING_PREINSCRIPTION_LEAD_SOURCE }
          : { in: [...LANDING_LEAD_SOURCES] },
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const [statsRows, nouveaux, total, rows] = await Promise.all([
      prisma.lead.groupBy({
        by: ['source'],
        where: { source: { in: [...LANDING_LEAD_SOURCES] } },
        _count: { _all: true },
      }),
      prisma.lead.count({
        where: {
          source: { in: [...LANDING_LEAD_SOURCES] },
          status: 'NEW',
        },
      }),
      prisma.lead.count({ where: baseWhere }),
      prisma.lead.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          formation: {
            select: { id: true, name: true, slug: true },
          },
          candidature: {
            select: {
              id: true,
              userId: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const statsMap = Object.fromEntries(statsRows.map((r) => [r.source, r._count._all]));
    const stats = {
      totalLanding: LANDING_LEAD_SOURCES.reduce((acc, s) => acc + (statsMap[s] ?? 0), 0),
      quote: statsMap[LANDING_QUOTE_LEAD_SOURCE] ?? 0,
      preinscription: statsMap[LANDING_PREINSCRIPTION_LEAD_SOURCE] ?? 0,
      nouveaux,
    };

    const items = rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      source: r.source,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      formation: r.formation,
      candidature: r.candidature,
    }));

    return ok({
      stats,
      items,
      pagination: { page, limit, total },
    });
  } catch (e) {
    console.error('[landing-leads GET]', e);
    return fail('Impossible de charger les leads landing.', 500, e);
  }
}
