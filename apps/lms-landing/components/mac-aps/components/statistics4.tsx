'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useMacApsSheetContent } from '../content';

export function MacApsStatistics4() {
  const content = useMacApsSheetContent();
  const stats = content.t(`${content.path}.stats4`, { returnObjects: true }) as {
    items: { total: string; label: string }[];
  };

  return <SheetStatGrid items={stats.items} columnsClassName="sm:grid-cols-4" />;
}
