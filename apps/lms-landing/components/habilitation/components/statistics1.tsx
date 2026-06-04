'use client';

import { TrendingUp } from 'lucide-react';
import { type HabType } from '../../habilitation-details-sheet';
import { useHabSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function HabStatistics1({ type }: { type: HabType }) {
  const content = useHabSheetContent(type);
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
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.traineesTotal,
      label: content.common('stats.traineesCount'),
      badgeLabel: 'Pers.',
      badgeColor: 'success',
      text: content.common('stats.perSession'),
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.priceTotal,
      label: content.common('stats.trainingPrice'),
      badgeLabel: stats.priceBadge,
      badgeColor: 'warning',
      text: stats.priceText,
      number: stats.priceSuffix,
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.successTotal,
      label: content.common('stats.successRate'),
      badgeLabel: stats.successBadge,
      badgeColor: 'success',
      text: content.common('stats.clientSatisfaction'),
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
  ];

  return <SheetStatGrid items={items} columnsClassName="md:grid-cols-4" showBadges />;
}
