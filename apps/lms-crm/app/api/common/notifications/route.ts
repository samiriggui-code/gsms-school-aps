import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { InAppNotificationCategory, Prisma } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  buildNotificationScopeWhere,
  resolveNotificationsScope,
  startOfTodayUtc,
} from '@/lib/notifications-scope';

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

function tabFilter(tab: string): Prisma.InAppNotificationWhereInput {
  if (tab === 'unread') return { archivedAt: null, readAt: null };
  if (tab === 'archived') return { archivedAt: { not: null } };
  return { archivedAt: null };
}

async function scopedUserWhere(scopeParam: string | null) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  const scope = resolveNotificationsScope(session.user.roleSlug, scopeParam);
  return {
    userId,
    scope,
    base: { userId, ...buildNotificationScopeWhere(scope) } satisfies Prisma.InAppNotificationWhereInput,
  };
}

export async function GET(request: NextRequest) {
  const ctx = await scopedUserWhere(new URL(request.url).searchParams.get('scope'));
  if (!ctx) return fail('Unauthorized request', 401);

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

  const where: Prisma.InAppNotificationWhereInput = {
    ...ctx.base,
    ...tabFilter(tab),
    ...searchWhere,
    ...categoryWhere,
  };

  const activeWhere: Prisma.InAppNotificationWhereInput = {
    ...ctx.base,
    archivedAt: null,
  };

  const todayStart = startOfTodayUtc();

  const [
    items,
    total,
    unreadCount,
    readCount,
    archivedCount,
    todayCount,
    categoryGroups,
  ] = await Promise.all([
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
      where: { ...ctx.base, archivedAt: { not: null } },
    }),
    prisma.inAppNotification.count({
      where: { ...activeWhere, createdAt: { gte: todayStart } },
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
    scope: ctx.scope,
    pagination: isPaginated ? { page, limit, total } : undefined,
    stats: {
      active: unreadCount + readCount,
      unread: unreadCount,
      read: readCount,
      archived: archivedCount,
      today: todayCount,
      byCategory,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await scopedUserWhere(new URL(request.url).searchParams.get('scope'));
  if (!ctx) return fail('Unauthorized request', 401);

  const body = await request.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  if (action === 'read_all') {
    await prisma.inAppNotification.updateMany({
      where: {
        ...ctx.base,
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
        ...ctx.base,
        archivedAt: null,
      },
      data: { archivedAt: new Date(), readAt: new Date() },
    });
    return ok({ ok: true });
  }

  return fail('Action invalide', 400);
}
