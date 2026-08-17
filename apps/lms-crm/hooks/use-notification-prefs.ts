'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationChannelPrefs,
} from '@/lib/user-notification-prefs';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export function useNotificationPrefs() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [prefs, setPrefs] = useState<NotificationChannelPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const res = await apiFetch('/api/common/user-notification-prefs');
      const json = await res.json().catch(() => ({}));
      if (!cancelled && res.ok) {
        const data = unwrapSectionApiData<NotificationChannelPrefs>(json);
        if (data) setPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...data });
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = (patch: Partial<NotificationChannelPrefs>) => {
    if (!userId) return;
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      void apiFetch('/api/common/user-notification-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return next;
    });
  };

  return { prefs, update, ready: ready && Boolean(userId) };
}
