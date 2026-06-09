'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const MAC_APS_PATH = 'landing.sheetContent.macAps' as const;

export function macApsSheetPath() {
  return MAC_APS_PATH;
}

export function useMacApsSheetContent() {
  return useSheetContent(MAC_APS_PATH);
}
