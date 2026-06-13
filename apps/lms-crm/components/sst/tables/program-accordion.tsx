'use client';

import { type SstType } from '../../sst-details-sheet';
import { useSstSheetContent } from '../content';
import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';

export function SstProgramAccordion({ type }: { type: SstType }) {
  const content = useSstSheetContent(type);
  return <SheetProgramAccordion modules={content.modules} />;
}
