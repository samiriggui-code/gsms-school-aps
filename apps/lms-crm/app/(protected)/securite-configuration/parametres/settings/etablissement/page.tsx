'use client';

import { SETTINGS_ANCHOR_IDS } from '../lib/settings-anchors';
import { useSettingsSubpageRedirect } from '../components/use-settings-subpage-redirect';

export default function EtablissementSettingsPage() {
  useSettingsSubpageRedirect(SETTINGS_ANCHOR_IDS.etablissement);
  return null;
}
