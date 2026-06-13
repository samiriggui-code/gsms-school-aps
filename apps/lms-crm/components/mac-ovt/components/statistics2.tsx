'use client';

import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { useMacOvtSheetContent } from '../content';

export function MacOvtStatistics2() {
  const content = useMacOvtSheetContent();
  const items = content.t(`${content.path}.stats2`, { returnObjects: true }) as {
    total: string;
    label: string;
  }[];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
