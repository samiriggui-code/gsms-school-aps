'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const MAC_OVT_PATH = 'landing.sheetContent.macOvt' as const;

export function macOvtSheetPath() {
  return MAC_OVT_PATH;
}

export function useMacOvtSheetContent() {
  return useSheetContent(MAC_OVT_PATH);
}
