'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useBsBeSheetContent } from '../content';

export function BsBeStatistics2() {
  const content = useBsBeSheetContent();
  const items = content.t(`${content.path}.stats2`, { returnObjects: true }) as {
    total: string;
    label: string;
  }[];
  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
