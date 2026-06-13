'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const ASRA_PATH = 'landing.sheetContent.asra' as const;

export function asraSheetPath() {
  return ASRA_PATH;
}

export function useAsraSheetContent() {
  return useSheetContent(ASRA_PATH);
}
