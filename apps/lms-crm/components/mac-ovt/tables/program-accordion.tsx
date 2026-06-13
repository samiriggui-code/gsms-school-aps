'use client';

import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';
import { useMacOvtSheetContent } from '../content';

export function MacOvtProgramAccordion() {
  const content = useMacOvtSheetContent();
  return <SheetProgramAccordion modules={content.modules} />;
}
