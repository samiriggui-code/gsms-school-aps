'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function Statistics2({}: object) {
  const content = useSheetContent('landing.sheetContent.tfp');
  const stats = content.t(`${content.path}.programStats`, { returnObjects: true }) as {
    uvCount: string;
    totalVolume: string;
    theory: string;
    practice: string;
  };

  const items = [
    { total: stats.uvCount, label: content.common('programTabStats.uvCount') },
    { total: stats.totalVolume, label: content.common('programTabStats.totalVolume') },
    { total: stats.theory, label: content.common('programTabStats.theory') },
    { total: stats.practice, label: content.common('programTabStats.practice') },
  ];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}