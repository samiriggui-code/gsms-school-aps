'use client';

import { type SsiapLevel, type SsiapType } from '../../ssiap-details-sheet';
import { useSsiapSheetContent } from '../content';
import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';

export function SsiapProgramAccordion({ level, type }: { level: SsiapLevel; type: SsiapType }) {
  const content = useSsiapSheetContent(level, type);
  return <SheetProgramAccordion modules={content.modules} />;
}
