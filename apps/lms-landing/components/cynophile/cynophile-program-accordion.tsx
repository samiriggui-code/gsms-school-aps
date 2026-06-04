'use client';

import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';
import { useCynophileSheetContent } from './content';

export function CynophileProgramAccordion() {
  const content = useCynophileSheetContent();
  return <SheetProgramAccordion modules={content.modules} />;
}
