'use client';

import { type EntrepriseType } from '../../entreprise-details-sheet';
import { useEntrepriseSheetContent } from '../content';
import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';

export function EntreprisePrerequisitesTable({ type }: { type: EntrepriseType }) {
  const content = useEntrepriseSheetContent(type);
  return (
    <SheetPrerequisitesTable
      rows={content.prerequisites}
      headers={{
        item: content.common('prerequisiteTable.condition'),
        detail: content.common('prerequisiteTable.status'),
        importance: content.common('prerequisiteTable.required'),
      }}
    />
  );
}
