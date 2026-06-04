'use client';

import { type AutresType } from '../../autres-details-sheet';
import { useAutresSheetContent } from '../content';
import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';

export function AutresProgramAccordion({ type }: { type: AutresType }) {
  const content = useAutresSheetContent(type);
  return <SheetProgramAccordion modules={content.modules} />;
}
