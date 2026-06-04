'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useCynophileSheetContent } from './content';

export function CynophileStatistics2() {
  const content = useCynophileSheetContent();
  const items = content.t(`${content.path}.stats2`, { returnObjects: true }) as {
    total: string;
    label: string;
  }[];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
