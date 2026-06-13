'use client';

import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';
import { useOvtSheetContent } from '../content';

export function OvtProgramAccordion() {
  const content = useOvtSheetContent();
  return <SheetProgramAccordion modules={content.modules} />;
}
