'use client';

import { type SsiapLevel, type SsiapType } from '../../ssiap-details-sheet';
import { useSsiapSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function SsiapStatistics4({ level, type }: { level: SsiapLevel; type: SsiapType }) {
  const content = useSsiapSheetContent(level, type);
  const stats = content.t(`${content.path}.prerequisiteStats`, { returnObjects: true }) as {
    cpf: string;
    funding: string;
    recycle: string;
    validity: string;
    recycleLabel: string;
    validityLabel: string;
  };

  const items = [
    { total: stats.cpf, label: content.t('landing.sheets.financing.cpfEligible') },
    { total: stats.funding, label: content.t('landing.sheets.financing.fundingOptions') },
    { total: stats.recycle, label: stats.recycleLabel },
    { total: stats.validity, label: stats.validityLabel },
  ];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" />;
}
