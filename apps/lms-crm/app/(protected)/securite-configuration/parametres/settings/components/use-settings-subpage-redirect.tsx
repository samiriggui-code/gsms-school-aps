'use client';

import { useEffect } from 'react';
import {
  SETTINGS_BASE_PATH,
  type SettingsAnchorId,
} from '../lib/settings-anchors';

export function useSettingsSubpageRedirect(anchorId: SettingsAnchorId) {
  useEffect(() => {
    window.location.replace(`${SETTINGS_BASE_PATH}#${anchorId}`);
  }, [anchorId]);
}
