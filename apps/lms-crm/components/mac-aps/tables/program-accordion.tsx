'use client';

import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';
import { useMacApsSheetContent } from '../content';

export function MacApsProgramAccordion() {
  const content = useMacApsSheetContent();
  return <SheetProgramAccordion modules={content.modules} />;
}
