'use client';

import { useSettingsSubpageRedirect } from '../components/use-settings-subpage-redirect';
import { SETTINGS_ANCHOR_IDS } from '../lib/settings-anchors';

export default function NotificationsSettingsPage() {
  useSettingsSubpageRedirect(SETTINGS_ANCHOR_IDS.notifications);
  return null;
}
