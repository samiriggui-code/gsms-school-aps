'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';

export function DetailsInvoiceTable() {
  const content = useSheetContent('landing.sheetContent.tfp');
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
