'use client';

import { useSheetContent } from '@/hooks/useSheetContent';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function Statistics4({}: object) {
  const content = useSheetContent('landing.sheetContent.tfp');
  const stats = content.t(`${content.path}.prerequisiteStats`, { returnObjects: true }) as {
    age: string;
    french: string;
    cnaps: string;
    criminalRecord: string;
  };

  const items = [
    { total: stats.age, label: content.common('prerequisiteStats.age') },
    { total: stats.french, label: content.common('prerequisiteStats.french') },
    { total: stats.cnaps, label: content.common('prerequisiteStats.cnaps') },
    { total: stats.criminalRecord, label: content.common('prerequisiteStats.criminalRecord') },
  ];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}