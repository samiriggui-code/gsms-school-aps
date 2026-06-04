import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireSessionUserId } from '@/app/api/_shared/topbar-auth';

export async function GET() {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth.error;

  const { userId } = auth;

  const [notificationUnread, chatParticipantRows] = await Promise.all([
    prisma.inAppNotification.count({
      where: {
        userId,
        archivedAt: null,
        readAt: null,
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

  return ok({ notificationUnread, chatUnread });
}
