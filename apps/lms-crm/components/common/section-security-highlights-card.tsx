'use client';

import {
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getIcon } from '@/lib/icons';
import { useTranslation } from '@/hooks/useTranslation';

interface ISecurityHighlightsRow {
  icon: LucideIcon | string;
  text: string;
  total: number | string;
  stats: number;
  trend?: 'up' | 'down' | 'neutral';
  increase?: boolean;
  unit?: string;
}

interface ISecurityHighlightsItem {
  badgeColor: string;
  label: string;
}

export interface SectionSecurityHighlightsCardProps {
  titleKey: string;
  limit?: number;
  statsData?: ISecurityHighlightsRow[];
  overallPerformance?: {
    value: number;
    trend: number;
  };
  categories?: ISecurityHighlightsItem[];
}

export function SectionSecurityHighlightsCard({
  titleKey,
  limit,
  statsData,
  overallPerformance = { value: 0, trend: 0 },
  categories = [],
}: SectionSecurityHighlightsCardProps) {
  const { t } = useTranslation();
  const rows = statsData ?? [];

  const renderRow = (row: ISecurityHighlightsRow, index: number) => {
    const Icon = getIcon(row.icon);
    return (
      <div key={index} className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className="size-4.5 text-muted-foreground" />
          <span className="text-sm font-normal text-mono">{row.text}</span>
        </div>
        <div className="flex items-center text-sm font-medium text-foreground gap-5 lg:gap-8">
          <span className="lg:text-right">
            {row.total}
            {row.unit}
          </span>
          <span className="flex items-center justify-end gap-1">
            {row.trend === 'up' || (row.increase && row.trend !== 'neutral') ? (
              <TrendingUp className="text-green-500 size-4" />
            ) : row.trend === 'down' || (!row.increase && row.trend !== 'neutral') ? (
              <TrendingDown className="text-destructive size-4" />
            ) : (
              <span className="text-blue-500 font-bold size-4 flex items-center justify-center text-lg">•</span>
            )}
            {row.stats}%
          </span>
        </div>
      </div>
    );
  };

  const renderItem = (item: ISecurityHighlightsItem, index: number) => (
    <div key={index} className="flex items-center gap-1.5">
      <BadgeDot className={item.badgeColor} />
      <span className="text-sm font-normal text-foreground">{item.label}</span>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t(titleKey)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 lg:p-8 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            {t('securityHighlights.overallPerformance')}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-semibold text-mono">
              {overallPerformance.value ? `${overallPerformance.value.toFixed(1)}%` : t('securityHighlights.notAvailable')}
            </span>
            {overallPerformance.trend !== undefined && (
              <Badge
                size="sm"
                variant={
                  overallPerformance.trend > 0
                    ? 'success'
                    : overallPerformance.trend < 0
                      ? 'destructive'
                      : 'primary'
                }
                appearance="light"
              >
                {overallPerformance.trend > 0 ? '+' : ''}
                {overallPerformance.trend}%
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 mb-1.5">
          <div className="bg-blue-500 h-2 w-full max-w-[50%] rounded-xs" />
          <div className="bg-green-500 h-2 w-full max-w-[30%] rounded-xs" />
          <div className="bg-orange-500 h-2 w-full max-w-[20%] rounded-xs" />
        </div>
        <div className="flex items-center flex-wrap gap-4 mb-1">{categories.map(renderItem)}</div>
        <div className="border-b border-input" />
        <div className="grid gap-3">{rows.slice(0, limit).map(renderRow)}</div>
      </CardContent>
    </Card>
  );
}

export type {
  ISecurityHighlightsRow,
  ISecurityHighlightsItem,
};
