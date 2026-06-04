'use client';

import { useSheetContent } from '@/hooks/useSheetContent';

const BS_BE_PATH = 'landing.sheetContent.bsBe';

export function bsBeSheetPath() {
  return BS_BE_PATH as const;
}

export function useBsBeSheetContent() {
  return useSheetContent(BS_BE_PATH);
}
