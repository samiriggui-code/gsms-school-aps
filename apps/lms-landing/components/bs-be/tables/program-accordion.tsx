'use client';

import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';
import { useBsBeSheetContent } from '../content';

export function BsBeProgramAccordion() {
  const content = useBsBeSheetContent();
  return <SheetProgramAccordion modules={content.modules} />;
}
