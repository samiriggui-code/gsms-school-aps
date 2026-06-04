'use client';

import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';
import { useOvtSheetContent } from '../content';

export function OvtPrerequisitesTable() {
  const content = useOvtSheetContent();
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
