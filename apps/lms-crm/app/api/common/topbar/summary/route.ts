import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  buildNotificationScopeWhere,
  resolveNotificationsScope,
} from '@/lib/notifications-scope';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return fail('Unauthorized request', 401);

  const scopeParam = new URL(request.url).searchParams.get('scope');
  const scope = resolveNotificationsScope(session.user.roleSlug, scopeParam);
  const scopeWhere = buildNotificationScopeWhere(scope);

  const [notificationUnread, chatParticipantRows] = await Promise.all([
    prisma.inAppNotification.count({
      where: {
        userId,
        archivedAt: null,
        readAt: null,
        ...scopeWhere,
      },
    }),
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

  return ok({ notificationUnread, chatUnread, scope });
}
