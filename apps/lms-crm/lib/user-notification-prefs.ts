/** Préférences notifications (localStorage jusqu'à API dédiée). */

export type NotificationChannelPrefs = {
  email: boolean;
  inApp: boolean;
  chat: boolean;
  desktop: boolean;
  doNotDisturb: boolean;
  academicAlerts: boolean;
  sessionReminders: boolean;
  chatMessages: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationChannelPrefs = {
  email: true,
  inApp: true,
  chat: true,
  desktop: true,
  doNotDisturb: false,
  academicAlerts: true,
  sessionReminders: true,
  chatMessages: true,
};

const STORAGE_PREFIX = 'lms:notification-prefs:';

export function notificationPrefsKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadNotificationPrefs(userId: string): NotificationChannelPrefs {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(notificationPrefsKey(userId));
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(userId: string, prefs: NotificationChannelPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(notificationPrefsKey(userId), JSON.stringify(prefs));
}
