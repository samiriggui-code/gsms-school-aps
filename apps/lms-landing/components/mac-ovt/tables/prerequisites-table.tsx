'use client';

import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';
import { useMacOvtSheetContent } from '../content';

export function MacOvtPrerequisitesTable() {
  const content = useMacOvtSheetContent();
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
