import { NextRequest } from 'next/server';
import type { InAppNotificationCategory } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireSessionUserId } from '@/app/api/_shared/topbar-auth';

function serializeNotification(row: {
  id: string;
  category: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    unread: !row.readAt && !row.archivedAt,
  };
}

function tabFilter(tab: string) {
  if (tab === 'unread') return { archivedAt: null, readAt: null };
  if (tab === 'archived') return { archivedAt: { not: null } };
  return { archivedAt: null };
}

export async function GET(request: NextRequest) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'all';
  const query = url.searchParams.get('query')?.trim() || '';
  const categoryRaw = url.searchParams.get('category')?.trim() || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const isPaginated = url.searchParams.has('page') || url.searchParams.has('limit');
  const limit = isPaginated
    ? Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '10', 10) || 10))
    : 50;
  const skip = isPaginated ? (page - 1) * limit : 0;

  const searchWhere = query
    ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { body: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const categoryWhere =
    categoryRaw && categoryRaw !== 'all'
      ? { category: categoryRaw as InAppNotificationCategory }
      : {};

  const where = {
    userId: auth.userId,
    ...tabFilter(tab),
    ...searchWhere,
    ...categoryWhere,
  };

  const activeWhere = { userId: auth.userId, archivedAt: null };

  const [items, total, unreadCount, readCount, archivedCount, categoryGroups] =
    await Promise.all([
      prisma.inAppNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inAppNotification.count({ where }),
      prisma.inAppNotification.count({
        where: { ...activeWhere, readAt: null },
      }),
      prisma.inAppNotification.count({
        where: { ...activeWhere, readAt: { not: null } },
      }),
      prisma.inAppNotification.count({
        where: { userId: auth.userId, archivedAt: { not: null } },
      }),
      prisma.inAppNotification.groupBy({
        by: ['category'],
        where: activeWhere,
        _count: { _all: true },
      }),
    ]);

  const byCategory = Object.fromEntries(
    categoryGroups.map((g) => [g.category, g._count._all]),
  ) as Record<string, number>;

  return ok({
    items: items.map(serializeNotification),
    unreadCount,
    pagination: isPaginated ? { page, limit, total } : undefined,
    stats: {
      active: unreadCount + readCount,
      unread: unreadCount,
      read: readCount,
      archived: archivedCount,
      byCategory,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  if (action === 'read_all') {
    await prisma.inAppNotification.updateMany({
      where: {
        userId: auth.userId,
        archivedAt: null,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return ok({ ok: true });
  }

  if (action === 'archive_all') {
    await prisma.inAppNotification.updateMany({
      where: {
        userId: auth.userId,
        archivedAt: null,
      },
      data: { archivedAt: new Date(), readAt: new Date() },
    });
    return ok({ ok: true });
  }

  return fail('Action invalide', 400);
}
