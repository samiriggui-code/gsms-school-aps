'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import type { AutresType } from '@/components/autres-details-sheet';

const AUTRES_TYPE_KEYS: Record<AutresType, 'commission' | 'intra'> = {
  'Commission de securite': 'commission',
  'Formation intra-entreprise securite': 'intra',
};

export function autresSheetPath(type: AutresType) {
  return `landing.sheetContent.autres.${AUTRES_TYPE_KEYS[type]}` as const;
}

export function useAutresSheetContent(type: AutresType) {
  return useSheetContent(autresSheetPath(type));
}
