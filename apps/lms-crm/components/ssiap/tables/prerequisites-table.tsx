'use client';

import { type SsiapLevel, type SsiapType } from '../../ssiap-details-sheet';
import { useSsiapSheetContent } from '../content';
import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';

export function SsiapPrerequisitesTable({ level, type }: { level: SsiapLevel; type: SsiapType }) {
  const content = useSsiapSheetContent(level, type);
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
