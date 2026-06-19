import { NextRequest } from 'next/server';
import type { InAppNotificationCategory, InAppNotificationChannel, Prisma } from '@repo/database';
import { hydrateNotificationAvatarFields } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireNotificationsSession } from '@/app/api/_shared/topbar-auth';
import { prisma } from '@/lib/prisma';
import {
  buildNotificationScopeWhere,
  filterNotificationItemsByModulePermission,
  resolveNotificationsScope,
  scopeNotificationChannels,
  startOfTodayUtc,
} from '@/lib/notifications-scope';

function serializeNotification(row: {
  id: string;
  category: string;
  channel: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  metadata?: unknown;
}) {
  const meta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const severityRaw = meta.severity;
  const severity =
    severityRaw === 'CRITICAL' || severityRaw === 'WARNING' || severityRaw === 'INFO'
      ? severityRaw
      : null;

  return {
    id: row.id,
    category: row.category,
    channel: row.channel,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.readAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    unread: !row.readAt && !row.archivedAt,
    moduleKey: typeof meta.moduleKey === 'string' ? meta.moduleKey : null,
    eventType: typeof meta.eventType === 'string' ? meta.eventType : null,
    severity,
    actionType: typeof meta.actionType === 'string' ? meta.actionType : null,
    invitationId: typeof meta.invitationId === 'string' ? meta.invitationId : null,
    conversationId: typeof meta.conversationId === 'string' ? meta.conversationId : null,
    conversationTitle:
      typeof meta.conversationTitle === 'string' ? meta.conversationTitle : null,
    teamName: typeof meta.teamName === 'string' ? meta.teamName : null,
    actorName: typeof meta.actorName === 'string' ? meta.actorName : null,
    actorAvatar: typeof meta.actorAvatar === 'string' ? meta.actorAvatar : null,
    actorId:
      typeof meta.actorId === 'string'
        ? meta.actorId
        : typeof meta.actorUserId === 'string'
          ? meta.actorUserId
          : null,
    entityImageUrl: typeof meta.entityImageUrl === 'string' ? meta.entityImageUrl : null,
    avatarKind: typeof meta.avatarKind === 'string' ? meta.avatarKind : null,
    mentionTopic: typeof meta.mentionTopic === 'string' ? meta.mentionTopic : null,
    mentionTopicHref: typeof meta.mentionTopicHref === 'string' ? meta.mentionTopicHref : null,
    mentionQuote: typeof meta.mentionQuote === 'string' ? meta.mentionQuote : null,
    contextLabel: typeof meta.contextLabel === 'string' ? meta.contextLabel : null,
  };
}

function tabFilter(tab: string): Prisma.InAppNotificationWhereInput {
  if (tab === 'unread') return { archivedAt: null, readAt: null };
  if (tab === 'archived') return { archivedAt: { not: null } };
  return { archivedAt: null };
}

async function scopedUserWhere(scopeParam: string | null) {
  const auth = await requireNotificationsSession();
  if ('error' in auth) return { error: auth.error as ReturnType<typeof fail> };

  const scope = resolveNotificationsScope(auth.session.user?.roleSlug, scopeParam);
  const permissionSlugs = auth.session.user?.permissionSlugs ?? [];
  return {
    userId: auth.userId,
    scope,
    permissionSlugs,
    base: { userId: auth.userId, ...buildNotificationScopeWhere(scope) } satisfies Prisma.InAppNotificationWhereInput,
  };
}

export async function GET(request: NextRequest) {
  const ctx = await scopedUserWhere(new URL(request.url).searchParams.get('scope'));
  if ('error' in ctx) return ctx.error;

  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'all';
  const query = url.searchParams.get('query')?.trim() || '';
  const categoryRaw = url.searchParams.get('category')?.trim() || '';
  const channelRaw = url.searchParams.get('channel')?.trim() || '';
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

  const allowedChannels = scopeNotificationChannels(ctx.scope);
  const channelWhere =
    channelRaw && channelRaw !== 'all' && allowedChannels.includes(channelRaw as InAppNotificationChannel)
      ? { channel: channelRaw as InAppNotificationChannel }
      : {};

  const modulePrefix = url.searchParams.get('module')?.trim() || '';
  const moduleWhere: Prisma.InAppNotificationWhereInput = modulePrefix
    ? {
        OR: [
          { metadata: { path: ['moduleKey'], equals: modulePrefix } },
          { metadata: { path: ['moduleKey'], string_starts_with: `${modulePrefix}.` } },
        ],
      }
    : {};

  const where: Prisma.InAppNotificationWhereInput = {
    ...ctx.base,
    ...tabFilter(tab),
    ...searchWhere,
    ...categoryWhere,
    ...channelWhere,
    ...moduleWhere,
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
    channelGroups,
  ] = await Promise.all([
    prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        category: true,
        channel: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        archivedAt: true,
        createdAt: true,
        metadata: true,
      },
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
    prisma.inAppNotification.groupBy({
      by: ['channel'],
      where: activeWhere,
      _count: { _all: true },
    }),
  ]);

  const byCategory = Object.fromEntries(
    categoryGroups.map((g) => [g.category, g._count._all]),
  ) as Record<string, number>;

  const byChannel = Object.fromEntries(
    channelGroups.map((g) => [g.channel, g._count._all]),
  ) as Record<string, number>;

  const severityCounts = { CRITICAL: 0, WARNING: 0, INFO: 0 };
  const severityRows = await prisma.inAppNotification.findMany({
    where: { ...activeWhere, ...moduleWhere },
    select: { metadata: true },
    take: 500,
  });
  for (const row of severityRows) {
    const meta =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
    const s = meta.severity;
    if (s === 'CRITICAL' || s === 'WARNING' || s === 'INFO') {
      severityCounts[s] += 1;
    }
  }

  const avatarHydration = await hydrateNotificationAvatarFields(prisma, items);

  const serialized = items.map((row, index) => {
    const base = serializeNotification(row);
    const hydrated = avatarHydration.get(index);
    if (!hydrated) return base;
    return {
      ...base,
      actorAvatar: hydrated.actorAvatar ?? base.actorAvatar,
      entityImageUrl: hydrated.entityImageUrl ?? base.entityImageUrl,
      avatarKind: hydrated.avatarKind ?? base.avatarKind,
    };
  });

  return ok({
    items: filterNotificationItemsByModulePermission(
      serialized,
      ctx.scope === 'crm-user' ? ctx.permissionSlugs : undefined,
    ),
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
      byChannel,
      bySeverity: severityCounts,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await scopedUserWhere(new URL(request.url).searchParams.get('scope'));
  if ('error' in ctx) return ctx.error;

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
