'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import type { EntrepriseType } from '@/components/entreprise-details-sheet';

const ENTREPRISE_TYPE_KEYS: Record<
  EntrepriseType,
  | 'guideFileSerreFile'
  | 'ari'
  | 'manipulationExtincteur'
  | 'esi'
  | 'ssi'
  | 'cssi'
  | 'evacuationIncendie'
  | 'epi'
> = {
  'Guide File / Serre File': 'guideFileSerreFile',
  ARI: 'ari',
  'Manipulation Extincteur': 'manipulationExtincteur',
  ESI: 'esi',
  SSI: 'ssi',
  CSSI: 'cssi',
  'Evacuation Incendie': 'evacuationIncendie',
  EPI: 'epi',
};

export function entrepriseSheetPath(type: EntrepriseType) {
  return `landing.sheetContent.entreprise.${ENTREPRISE_TYPE_KEYS[type]}` as const;
}

export function useEntrepriseSheetContent(type: EntrepriseType) {
  return useSheetContent(entrepriseSheetPath(type));
}
