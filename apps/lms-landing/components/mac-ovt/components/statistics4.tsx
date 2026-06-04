'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useMacOvtSheetContent } from '../content';

export function MacOvtStatistics4() {
  const content = useMacOvtSheetContent();
  const stats = content.t(`${content.path}.stats4`, { returnObjects: true }) as {
    items: { total: string; label: string }[];
  };

  return <SheetStatGrid items={stats.items} columnsClassName="sm:grid-cols-4" />;
}
