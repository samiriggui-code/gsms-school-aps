'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const OVT_PATH = 'landing.sheetContent.ovt' as const;

export function ovtSheetPath() {
  return OVT_PATH;
}

export function useOvtSheetContent() {
  return useSheetContent(OVT_PATH);
}
