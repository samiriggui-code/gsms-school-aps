'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useOvtSheetContent } from '../content';

export function OvtStatistics2() {
  const content = useOvtSheetContent();
  const items = content.t(`${content.path}.stats2`, { returnObjects: true }) as {
    total: string;
    label: string;
  }[];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
