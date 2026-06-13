'use client';

import { type AutresType } from '../../autres-details-sheet';
import { useAutresSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function AutresStatistics2({ type }: { type: AutresType }) {
  const content = useAutresSheetContent(type);
  const stats = content.t(`${content.path}.programStats`, { returnObjects: true }) as {
    standard: string;
    adaptability: string;
    ratio: string;
  };

  const items = [
    { total: stats.standard, label: content.common('programTabStats.standardVolume') },
    { total: stats.adaptability, label: content.common('programTabStats.adaptability') },
    { total: stats.ratio, label: content.common('programTabStats.theory') + '/' + content.common('programTabStats.practice') },
  ];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-3" />;
}
