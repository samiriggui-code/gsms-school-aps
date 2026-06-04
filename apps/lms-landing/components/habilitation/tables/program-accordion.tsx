'use client';

import { type HabType } from '../../habilitation-details-sheet';
import { useHabSheetContent } from '../content';
import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';

export function HabProgramAccordion({ type }: { type: HabType }) {
  const content = useHabSheetContent(type);
  return <SheetProgramAccordion modules={content.modules} />;
}
