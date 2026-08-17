import type { InAppNotificationCategory, PrismaClient } from '@repo/database';

/** Vérifie si l'utilisateur accepte les notifications in-app (préférences compte). */
export async function canDeliverInAppToUser(
  prisma: PrismaClient,
  userId: string,
): Promise<boolean> {
  const prefs = await prisma.userNotificationPreference.findUnique({
    where: { userId },
    select: { inApp: true, doNotDisturb: true },
  });
  if (!prefs) return true;
  if (prefs.doNotDisturb) return false;
  return prefs.inApp;
}

/** Filtre les destinataires selon préférences in-app. */
export async function filterInAppRecipients(
  prisma: PrismaClient,
  userIds: string[],
): Promise<string[]> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  const allowed: string[] = [];
  for (const userId of unique) {
    if (await canDeliverInAppToUser(prisma, userId)) {
      allowed.push(userId);
    }
  }
  return allowed;
}

/** Notifications système web (flags `SystemSetting.notify*Web`). */
export async function canDeliverSystemWebNotification(
  prisma: PrismaClient,
  category: InAppNotificationCategory,
): Promise<boolean> {
  const settings = await prisma.systemSetting.findFirst({
    select: {
      notifySystemErrorWeb: true,
      notifyStockWeb: true,
      notifyNewOrderWeb: true,
      notifyOrderStatusUpdateWeb: true,
      notifyPaymentFailureWeb: true,
    },
  });
  if (!settings) return true;

  switch (category) {
    case 'SYSTEM':
      return settings.notifySystemErrorWeb;
    case 'FINANCE':
      return settings.notifyNewOrderWeb || settings.notifyPaymentFailureWeb;
    default:
      return true;
  }
}
