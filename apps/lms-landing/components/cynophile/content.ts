'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const CYNOPHILE_PATH = 'landing.sheetContent.cynophile' as const;

export function cynophileSheetPath() {
  return CYNOPHILE_PATH;
}

export function useCynophileSheetContent() {
  return useSheetContent(CYNOPHILE_PATH);
}
