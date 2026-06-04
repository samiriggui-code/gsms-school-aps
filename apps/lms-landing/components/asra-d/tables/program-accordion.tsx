'use client';

import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';
import { useAsraSheetContent } from '../content';

export function AsraProgramAccordion() {
  const content = useAsraSheetContent();
  return <SheetProgramAccordion modules={content.modules} />;
}
