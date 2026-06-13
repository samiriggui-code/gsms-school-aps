'use client';

import { type SstType } from '../../sst-details-sheet';
import { useSstSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function SstStatistics4({ type }: { type: SstType }) {
  const content = useSstSheetContent(type);
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
