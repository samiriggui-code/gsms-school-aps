'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useAsraSheetContent } from '../content';

export function AsraStatistics2() {
  const content = useAsraSheetContent();
  const items = content.t(`${content.path}.stats2`, { returnObjects: true }) as {
    total: string;
    label: string;
  }[];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
