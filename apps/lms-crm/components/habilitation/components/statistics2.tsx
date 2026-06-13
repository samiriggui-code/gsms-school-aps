'use client';

import { type HabType } from '../../habilitation-details-sheet';
import { useHabSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function HabStatistics2({ type }: { type: HabType }) {
  const content = useHabSheetContent(type);
  const stat = content.t(`${content.path}.programStats`, { returnObjects: true }) as {
    standard: string;
    total: string;
    theory: string;
    practice: string;
  };

  const items = [
    { total: stat.standard, label: content.common('programTabStats.standardVolume') },
    { total: stat.total, label: content.common('programTabStats.totalVolume') },
    { total: stat.theory, label: content.common('programTabStats.theory') },
    { total: stat.practice, label: content.common('programTabStats.practice') },
  ];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
