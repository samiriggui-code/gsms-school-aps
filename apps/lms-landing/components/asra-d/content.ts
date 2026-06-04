'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const ASRA_PATH = 'landing.sheetContent.asra';

export function asraSheetPath() {
  return ASRA_PATH as const;
}

export function useAsraSheetContent() {
  return useSheetContent(ASRA_PATH);
}
