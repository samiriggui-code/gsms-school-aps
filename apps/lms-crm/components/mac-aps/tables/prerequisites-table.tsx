'use client';

import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';
import { useMacApsSheetContent } from '../content';

export function MacApsPrerequisitesTable() {
  const content = useMacApsSheetContent();
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
