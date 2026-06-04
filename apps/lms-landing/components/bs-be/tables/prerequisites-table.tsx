'use client';

import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';
import { useBsBeSheetContent } from '../content';

export function BsBePrerequisitesTable() {
  const content = useBsBeSheetContent();
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
