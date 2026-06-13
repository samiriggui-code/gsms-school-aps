'use client';

import { type HabType } from '../../habilitation-details-sheet';
import { useHabSheetContent } from '../content';
import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';

export function HabPrerequisitesTable({ type }: { type: HabType }) {
  const content = useHabSheetContent(type);
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
