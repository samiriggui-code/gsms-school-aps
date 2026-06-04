'use client';

import { TrendingUp } from 'lucide-react';
import { type EntrepriseType } from '../../entreprise-details-sheet';
import { useEntrepriseSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function EntrepriseStatistics4({ type }: { type: EntrepriseType }) {
  const content = useEntrepriseSheetContent(type);
  const stats = content.t(`${content.path}.prerequisiteStats`, { returnObjects: true }) as {
    access: string;
    location: string;
    quality: string;
    pedagogy: string;
    accessLabel: string;
    locationLabel: string;
    qualityLabel: string;
    pedagogyLabel: string;
    accessBadge: string;
    locationBadge: string;
    qualityBadge: string;
    pedagogyBadge: string;
    accessText: string;
    locationText: string;
    qualityText: string;
    pedagogyText: string;
  };

  const items = [
    {
      total: stats.access,
      label: stats.accessLabel,
      badgeLabel: stats.accessBadge,
      badgeColor: 'success',
      text: stats.accessText,
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.location,
      label: stats.locationLabel,
      badgeLabel: stats.locationBadge,
      badgeColor: 'success',
      text: stats.locationText,
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.quality,
      label: stats.qualityLabel,
      badgeLabel: stats.qualityBadge,
      badgeColor: 'success',
      text: stats.qualityText,
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.pedagogy,
      label: stats.pedagogyLabel,
      badgeLabel: stats.pedagogyBadge,
      badgeColor: 'success',
      text: stats.pedagogyText,
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
  ];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" showBadges />;
}
