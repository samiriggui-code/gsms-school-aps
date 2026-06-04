'use client';

import { type SstType } from '../../sst-details-sheet';
import { useSstSheetContent } from '../content';
import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';

export function SstPrerequisitesTable({ type }: { type: SstType }) {
  const content = useSstSheetContent(type);
  return (
    <SheetPrerequisitesTable
      rows={content.prerequisites}
      headers={{
        item: content.common('prerequisiteTable.item'),
        detail: content.common('prerequisiteTable.detail'),
        importance: content.common('prerequisiteTable.importance'),
      }}
    />
  );
}
