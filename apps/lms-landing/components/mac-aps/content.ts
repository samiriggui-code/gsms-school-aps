'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const MAC_APS_PATH = 'landing.sheetContent.macAps';

export function macApsSheetPath() {
  return MAC_APS_PATH as const;
}

export function useMacApsSheetContent() {
  return useSheetContent(MAC_APS_PATH);
}
