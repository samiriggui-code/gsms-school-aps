'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const BS_BE_PATH = 'landing.sheetContent.bsBe' as const;

export function bsBeSheetPath() {
  return BS_BE_PATH;
}

export function useBsBeSheetContent() {
  return useSheetContent(BS_BE_PATH);
}
