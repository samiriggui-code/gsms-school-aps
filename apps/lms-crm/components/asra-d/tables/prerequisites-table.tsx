'use client';

import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';
import { useAsraSheetContent } from '../content';

export function AsraPrerequisitesTable() {
  const content = useAsraSheetContent();
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
