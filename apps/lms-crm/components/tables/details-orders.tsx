'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';

export function DetailsOrdersTable() {
  const content = useSheetContent('landing.sheetContent.tfp');
  return <SheetProgramAccordion modules={content.modules} />;
}
