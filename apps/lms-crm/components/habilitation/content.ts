'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import type { HabType } from '@/components/habilitation-details-sheet';

const HAB_TYPE_KEYS: Record<HabType, 'h0b0' | 'br' | 'bsBe'> = {
  'H0/B0': 'h0b0',
  BR: 'br',
  'BS / BE Manoeuvre': 'bsBe',
};

export function habSheetPath(type: HabType) {
  return `landing.sheetContent.habilitation.${HAB_TYPE_KEYS[type]}` as const;
}

export function useHabSheetContent(type: HabType) {
  return useSheetContent(habSheetPath(type));
}
