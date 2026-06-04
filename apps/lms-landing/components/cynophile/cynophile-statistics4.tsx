'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useCynophileSheetContent } from './content';

export function CynophileStatistics4() {
  const content = useCynophileSheetContent();
  const stats = content.t(`${content.path}.stats4`, { returnObjects: true }) as {
    items: { total: string; label: string }[];
  };
  return <SheetStatGrid items={stats.items} columnsClassName="sm:grid-cols-4" />;
}
