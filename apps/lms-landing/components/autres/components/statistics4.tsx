'use client';

import { TrendingUp } from 'lucide-react';
import { type AutresType } from '../../autres-details-sheet';
import { useAutresSheetContent } from '../content';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';

export function AutresStatistics4({ type }: { type: AutresType }) {
  const content = useAutresSheetContent(type);
  const stats = content.t(`${content.path}.prerequisiteStats`, { returnObjects: true }) as {
    missionType: string;
    location: string;
    compliance: string;
    method: string;
    missionTypeLabel: string;
    locationLabel: string;
    complianceLabel: string;
    methodLabel: string;
    missionTypeBadge: string;
    locationBadge: string;
    complianceBadge: string;
    methodBadge: string;
    missionTypeText: string;
    locationText: string;
    complianceText: string;
    methodText: string;
  };

  const items = [
    {
      total: stats.missionType,
      label: stats.missionTypeLabel,
      badgeLabel: stats.missionTypeBadge,
      badgeColor: 'success',
      text: stats.missionTypeText,
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.location,
      label: stats.locationLabel,
      badgeLabel: stats.locationBadge,
      badgeColor: 'success',
      text: stats.locationText,
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.compliance,
      label: stats.complianceLabel,
      badgeLabel: stats.complianceBadge,
      badgeColor: 'success',
      text: stats.complianceText,
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: stats.method,
      label: stats.methodLabel,
      badgeLabel: stats.methodBadge,
      badgeColor: 'success',
      text: stats.methodText,
      icon: <TrendingUp className="size-3" />,
    },
  ];

  return <SheetStatGrid items={items} columnsClassName="sm:grid-cols-4" showBadges />;
}
