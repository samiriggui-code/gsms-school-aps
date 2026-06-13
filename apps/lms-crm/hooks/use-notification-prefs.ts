'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationChannelPrefs,
} from '@/lib/user-notification-prefs';

export function useNotificationPrefs() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [prefs, setPrefs] = useState<NotificationChannelPrefs>(DEFAULT_NOTIFICATION_PREFS);

  useEffect(() => {
    if (userId) setPrefs(loadNotificationPrefs(userId));
  }, [userId]);

  const update = (patch: Partial<NotificationChannelPrefs>) => {
    if (!userId) return;
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveNotificationPrefs(userId, next);
      return next;
    });
  };

  return { prefs, update, ready: Boolean(userId) };
}
