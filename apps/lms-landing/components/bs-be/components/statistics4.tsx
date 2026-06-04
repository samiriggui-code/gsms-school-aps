'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useBsBeSheetContent } from '../content';

export function BsBeStatistics4() {
  const content = useBsBeSheetContent();
  const stats = content.t(`${content.path}.stats4`, { returnObjects: true }) as {
    items: { total: string; label: string }[];
  };
  return <SheetStatGrid items={stats.items} columnsClassName="sm:grid-cols-4" />;
}
