import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireAuthenticatedSession } from '@/lib/auth/require-permission';
import type { NotificationChannelPrefs } from '@/lib/user-notification-prefs';
import { DEFAULT_NOTIFICATION_PREFS } from '@/lib/user-notification-prefs';

export async function GET() {
  const auth = await requireAuthenticatedSession();
  if ('error' in auth) return auth.error;

  const row = await prisma.userNotificationPreference.findUnique({
    where: { userId: auth.userId },
  });

  const prefs: NotificationChannelPrefs = row
    ? {
        email: row.email,
        inApp: row.inApp,
        chat: row.chat,
        desktop: row.desktop,
        doNotDisturb: row.doNotDisturb,
        academicAlerts: row.academicAlerts,
        sessionReminders: row.sessionReminders,
        chatMessages: row.chatMessages,
      }
    : DEFAULT_NOTIFICATION_PREFS;

  return ok(prefs);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthenticatedSession();
  if ('error' in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const current = await prisma.userNotificationPreference.findUnique({
    where: { userId: auth.userId },
  });

  const base = current ?? {
    email: DEFAULT_NOTIFICATION_PREFS.email,
    inApp: DEFAULT_NOTIFICATION_PREFS.inApp,
    chat: DEFAULT_NOTIFICATION_PREFS.chat,
    desktop: DEFAULT_NOTIFICATION_PREFS.desktop,
    doNotDisturb: DEFAULT_NOTIFICATION_PREFS.doNotDisturb,
    academicAlerts: DEFAULT_NOTIFICATION_PREFS.academicAlerts,
    sessionReminders: DEFAULT_NOTIFICATION_PREFS.sessionReminders,
    chatMessages: DEFAULT_NOTIFICATION_PREFS.chatMessages,
  };

  const row = await prisma.userNotificationPreference.upsert({
    where: { userId: auth.userId },
    create: {
      userId: auth.userId,
      email: body.email !== undefined ? Boolean(body.email) : base.email,
      inApp: body.inApp !== undefined ? Boolean(body.inApp) : base.inApp,
      chat: body.chat !== undefined ? Boolean(body.chat) : base.chat,
      desktop: body.desktop !== undefined ? Boolean(body.desktop) : base.desktop,
      doNotDisturb:
        body.doNotDisturb !== undefined ? Boolean(body.doNotDisturb) : base.doNotDisturb,
      academicAlerts:
        body.academicAlerts !== undefined
          ? Boolean(body.academicAlerts)
          : base.academicAlerts,
      sessionReminders:
        body.sessionReminders !== undefined
          ? Boolean(body.sessionReminders)
          : base.sessionReminders,
      chatMessages:
        body.chatMessages !== undefined ? Boolean(body.chatMessages) : base.chatMessages,
    },
    update: {
      ...(body.email !== undefined ? { email: Boolean(body.email) } : {}),
      ...(body.inApp !== undefined ? { inApp: Boolean(body.inApp) } : {}),
      ...(body.chat !== undefined ? { chat: Boolean(body.chat) } : {}),
      ...(body.desktop !== undefined ? { desktop: Boolean(body.desktop) } : {}),
      ...(body.doNotDisturb !== undefined ? { doNotDisturb: Boolean(body.doNotDisturb) } : {}),
      ...(body.academicAlerts !== undefined
        ? { academicAlerts: Boolean(body.academicAlerts) }
        : {}),
      ...(body.sessionReminders !== undefined
        ? { sessionReminders: Boolean(body.sessionReminders) }
        : {}),
      ...(body.chatMessages !== undefined ? { chatMessages: Boolean(body.chatMessages) } : {}),
    },
  });

  return ok({
    email: row.email,
    inApp: row.inApp,
    chat: row.chat,
    desktop: row.desktop,
    doNotDisturb: row.doNotDisturb,
    academicAlerts: row.academicAlerts,
    sessionReminders: row.sessionReminders,
    chatMessages: row.chatMessages,
  });
}
