'use client';

import { type AutresType } from '../../autres-details-sheet';
import { useAutresSheetContent } from '../content';
import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';

export function AutresPrerequisitesTable({ type }: { type: AutresType }) {
  const content = useAutresSheetContent(type);
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
