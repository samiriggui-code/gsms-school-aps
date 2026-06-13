'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import type { SsiapLevel, SsiapType } from '@/components/ssiap-details-sheet';

export function ssiapSheetPath(level: SsiapLevel, type: SsiapType) {
  return `landing.sheetContent.ssiap.level${level}.${type}` as const;
}

export function useSsiapSheetContent(level: SsiapLevel, type: SsiapType) {
  return useSheetContent(ssiapSheetPath(level, type));
}
