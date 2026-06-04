'use client';

import { type EntrepriseType } from '../../entreprise-details-sheet';
import { useEntrepriseSheetContent } from '../content';
import { SheetProgramAccordion } from '@/components/sheet-shared/program-accordion';

export function EntrepriseProgramAccordion({ type }: { type: EntrepriseType }) {
  const content = useEntrepriseSheetContent(type);
  return <SheetProgramAccordion modules={content.modules} />;
}
