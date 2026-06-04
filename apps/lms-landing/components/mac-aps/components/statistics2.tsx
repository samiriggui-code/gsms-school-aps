'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useMacApsSheetContent } from '../content';

export function MacApsStatistics2() {
  const content = useMacApsSheetContent();
  const items = content.t(`${content.path}.stats2`, { returnObjects: true }) as {
    total: string;
    label: string;
  }[];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
