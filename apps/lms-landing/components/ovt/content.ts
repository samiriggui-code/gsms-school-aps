'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const OVT_PATH = 'landing.sheetContent.ovt';

export function ovtSheetPath() {
  return OVT_PATH as const;
}

export function useOvtSheetContent() {
  return useSheetContent(OVT_PATH);
}
