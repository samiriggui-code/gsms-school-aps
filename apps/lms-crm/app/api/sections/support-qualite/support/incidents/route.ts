import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  Prisma,
  QualityIncidentSeverity,
  QualityIncidentStatus,
} from '@repo/database';
import { requireSupportEdit, requireSupportView } from '../../_lib/require-support-auth';
import { nextIncidentReference } from '../../_lib/ticket-reference';

export async function GET(request: NextRequest) {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const status = (sp.get('status') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.QualityIncidentWhereInput = {
    ...(status && status !== 'all' ? { status: status as QualityIncidentStatus } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { referenceCode: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const [total, reported, inProgress, resolved, critical, rows] = await Promise.all([
      prisma.qualityIncident.count({ where }),
      prisma.qualityIncident.count({ where: { status: 'REPORTED' } }),
      prisma.qualityIncident.count({
        where: { status: { in: ['UNDER_ANALYSIS', 'ACTION_IN_PROGRESS'] } },
      }),
      prisma.qualityIncident.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.qualityIncident.count({
        where: {
          severity: { in: ['HIGH', 'CRITICAL'] },
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      prisma.qualityIncident.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          ticket: { select: { id: true, referenceCode: true, subject: true } },
          equipment: { select: { id: true, label: true, serialNumber: true } },
        },
      }),
    ]);

    const resolved7d = await prisma.qualityIncident.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    });

    return ok({
      stats: { total, reported, inProgress, resolved, critical, resolved7d },
      items: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    console.error('[quality-incidents GET]', e);
    return fail('Impossible de charger les incidents.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSupportEdit();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const severity = String(body.severity ?? 'MEDIUM').trim() as QualityIncidentSeverity;
  const category = String(body.category ?? '').trim() || null;
  const ticketId = String(body.ticketId ?? '').trim() || null;
  const equipmentId = String(body.equipmentId ?? '').trim() || null;

  if (!title || !description) {
    return fail('Titre et description requis.', 400);
  }

  try {
    const count = await prisma.qualityIncident.count();
    const row = await prisma.qualityIncident.create({
      data: {
        referenceCode: await nextIncidentReference(count),
        title,
        description,
        severity: Object.values(QualityIncidentSeverity).includes(severity)
          ? severity
          : QualityIncidentSeverity.MEDIUM,
        category,
        ticketId,
        equipmentId,
        reportedById: auth.userId,
        assignedToId: String(body.assignedToId ?? '').trim() || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, referenceCode: true, subject: true } },
        equipment: { select: { id: true, label: true, serialNumber: true } },
      },
    });

    return ok(
      {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
      },
      201,
    );
  } catch (e) {
    console.error('[quality-incidents POST]', e);
    return fail('Création impossible.', 500, e);
  }
}
