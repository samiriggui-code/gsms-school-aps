'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import { SST_TYPE_KEYS, type SstType } from '@/components/sst-details-sheet';

export function sstSheetPath(type: SstType) {
  return `landing.sheetContent.sst.${SST_TYPE_KEYS[type]}` as const;
}

export function useSstSheetContent(type: SstType) {
  return useSheetContent(sstSheetPath(type));
}
