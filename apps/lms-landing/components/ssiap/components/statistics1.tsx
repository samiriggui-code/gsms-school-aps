'use client';

import { TrendingUp } from 'lucide-react';
import { type SsiapLevel, type SsiapType } from '../../ssiap-details-sheet';
import { useSsiapSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function SsiapStatistics1({ level, type }: { level: SsiapLevel; type: SsiapType }) {
  const content = useSsiapSheetContent(level, type);
  const stats = content.t(`${content.path}.stats1`, { returnObjects: true }) as {
    durationTotal: string;
    durationBadge: string;
    durationText: string;
    traineesTotal: string;
    priceTotal: string;
    priceBadge: string;
    priceText: string;
    priceSuffix: string;
    successTotal: string;
    successBadge: string;
  };

  const items = [
    {
      total: stats.durationTotal,
      label: content.common('stats.durationIndicative'),
      badgeLabel: stats.durationBadge,
      badgeColor: 'success',
      text: stats.durationText,
      number: '',
      icon: <TrendingUp />,
    },
    {
      total: stats.traineesTotal,
      label: content.common('stats.traineesCount'),
      badgeLabel: 'Pers.',
      badgeColor: 'success',
      text: content.common('stats.perSession'),
      number: '',
      icon: <TrendingUp />,
    },
    {
      total: stats.priceTotal,
      label: content.common('stats.trainingPrice'),
      badgeLabel: stats.priceBadge,
      badgeColor: 'warning',
      text: stats.priceText,
      number: stats.priceSuffix,
      icon: <TrendingUp />,
    },
    {
      total: stats.successTotal,
      label: content.common('stats.successRate'),
      badgeLabel: stats.successBadge,
      badgeColor: 'success',
      text: content.common('stats.clientSatisfaction'),
      number: '',
      icon: <TrendingUp />,
    },
  ];

  return <SheetStatGrid items={items} columnsClassName="md:grid-cols-4" showBadges />;
}
