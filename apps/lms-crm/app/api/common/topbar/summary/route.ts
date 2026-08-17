import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { withDbTimeout } from '@repo/database';
import { sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  buildModulePermissionWhere,
  buildNotificationScopeWhere,
  NOTIFICATIONS_VIEW_PERMISSION,
  resolveNotificationsScope,
} from '@/lib/notifications-scope';

const TOPBAR_SUMMARY_DB_TIMEOUT_MS = 4_000;

async function loadTopbarSummary(
  userId: string,
  scopeWhere: Record<string, unknown>,
  moduleWhere: Record<string, unknown>,
) {
  const notificationWhere = {
    userId,
    archivedAt: null,
    readAt: null,
    ...scopeWhere,
    ...moduleWhere,
  };

  const [notificationUnread, chatParticipantRows] = await Promise.all([
    prisma.inAppNotification.count({ where: notificationWhere }),
    prisma.chatParticipant.findMany({
      where: { userId },
      select: {
        lastReadAt: true,
        conversation: {
          select: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true, senderId: true },
            },
          },
        },
      },
    }),
  ]);

  let chatUnread = 0;
  for (const row of chatParticipantRows) {
    const last = row.conversation.messages[0];
    if (!last) continue;
    if (last.senderId === userId) continue;
    if (!row.lastReadAt || last.createdAt > row.lastReadAt) {
      chatUnread += 1;
    }
  }

  return { notificationUnread, chatUnread };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return fail('Unauthorized request', 401);

  const scopeParam = new URL(request.url).searchParams.get('scope');
  const scope = resolveNotificationsScope(session.user.roleSlug, scopeParam);
  const scopeWhere = buildNotificationScopeWhere(scope);
  const moduleWhere =
    scope === 'crm-user' && sessionHasPermission(session, NOTIFICATIONS_VIEW_PERMISSION)
      ? buildModulePermissionWhere(scope, session.user.permissionSlugs ?? [])
      : scope === 'crm-user'
        ? { id: { in: [] as string[] } }
        : {};

  try {
    const summary = await withDbTimeout(
      loadTopbarSummary(userId, scopeWhere, moduleWhere),
      TOPBAR_SUMMARY_DB_TIMEOUT_MS,
      null,
    );

    if (!summary) {
      console.warn('[topbar/summary] PostgreSQL indisponible ou lent — compteurs à zéro.');
      return ok({ notificationUnread: 0, chatUnread: 0, scope, degraded: true });
    }

    return ok({ ...summary, scope });
  } catch (error) {
    console.error('[topbar/summary] Erreur base de données:', error);
    return ok({ notificationUnread: 0, chatUnread: 0, scope, degraded: true });
  }
}
