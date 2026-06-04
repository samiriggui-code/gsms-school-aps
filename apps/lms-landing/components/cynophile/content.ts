'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const CYNOPHILE_PATH = 'landing.sheetContent.cynophile';

export function cynophileSheetPath() {
  return CYNOPHILE_PATH as const;
}

export function useCynophileSheetContent() {
  return useSheetContent(CYNOPHILE_PATH);
}
