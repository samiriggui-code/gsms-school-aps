'use client';

import { useSettingsSubpageRedirect } from '../components/use-settings-subpage-redirect';
import { SETTINGS_ANCHOR_IDS } from '../lib/settings-anchors';

export default function RegistreSettingsPage() {
  useSettingsSubpageRedirect(SETTINGS_ANCHOR_IDS.registre);
  return null;
}
