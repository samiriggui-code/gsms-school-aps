'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
};

interface ISecurityHighlightsRow {
  icon: string;
  text: string;
  total: number | string;
  stats: number;
  trend: 'up' | 'down' | 'neutral';
  unit?: string;
}

interface ISecurityHighlightsItem {
  badgeColor: string;
  label: string;
}

interface ISecurityHighlightsProps {
  limit?: number;
}

const SecurityHighlights = ({ limit }: ISecurityHighlightsProps) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ISecurityHighlightsRow[]>([]);
  const [items, setItems] = useState<ISecurityHighlightsItem[]>([]);
  const [overallPerformance, setOverallPerformance] = useState({ value: 0, trend: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch('/api/common/stats');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setRows(result.stats || []);
            setItems(result.categories || [
              { badgeColor: 'bg-blue-500', label: t('securityHighlights.categories.operations') },
              { badgeColor: 'bg-green-500', label: t('securityHighlights.categories.personnel') },
              { badgeColor: 'bg-orange-500', label: t('securityHighlights.categories.clients') },
            ]);
            setOverallPerformance(result.overallPerformance || { value: 0, trend: 0 });
          }
        }
      } catch (error) {
        console.error('Error fetching security highlights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHighlights();
  }, [t]);

  const renderRow = (row: ISecurityHighlightsRow, index: number) => {
    const Icon = iconMap[row.icon] || Shield;
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-1.5">
          <Icon className="size-4.5 text-muted-foreground" />
          <span className="text-sm font-normal text-mono">{row.text}</span>
        </div>
        <div className="flex items-center text-sm font-medium text-foreground gap-5 lg:gap-8">
          <span className="lg:text-right">
            {row.total}{row.unit}
          </span>
          <span className="flex items-center justify-end gap-1">
            {row.trend === 'up' ? (
              <TrendingUp className="text-green-500 size-4" />
            ) : row.trend === 'down' ? (
              <TrendingDown className="text-destructive size-4" />
            ) : null}
            {row.stats > 0 && `${row.stats}%`}
          </span>
        </div>
      </div>
    );
  };

  const renderItem = (item: ISecurityHighlightsItem, index: number) => {
    return (
      <div key={index} className="flex items-center gap-1.5">
        <BadgeDot className={item.badgeColor} />
        <span className="text-sm font-normal text-foreground">
          {item.label}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full min-w-0 w-full overflow-hidden">
        <CardContent className="flex items-center justify-center h-48">
          <span className="text-muted-foreground">{t('securityHighlights.loading')}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-w-0 w-full overflow-hidden">
      <CardHeader>
        <CardTitle>{t('securityHighlights.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4 p-5 lg:p-8 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            {t('securityHighlights.overallPerformance')}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-semibold text-mono">{overallPerformance.value}%</span>
            {overallPerformance.trend !== 0 && (
              <Badge size="sm" variant={overallPerformance.trend > 0 ? "success" : "destructive"} appearance="light">
                {overallPerformance.trend > 0 ? '+' : ''}{overallPerformance.trend}%
              </Badge>
            )}
          </div>
        </div>
        <div className="grid w-full min-w-0 grid-cols-[9fr_7fr_4fr] gap-1 mb-1.5">
          <div className="h-2 min-w-0 rounded-xs bg-blue-500" />
          <div className="h-2 min-w-0 rounded-xs bg-green-500" />
          <div className="h-2 min-w-0 rounded-xs bg-orange-500" />
        </div>
        <div className="flex items-center flex-wrap gap-4 mb-1">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
        <div className="border-b border-input"></div>
        <div className="grid gap-3">{(limit ? rows.slice(0, limit) : rows).map(renderRow)}</div>
      </CardContent>
    </Card>
  );
};

export {
  SecurityHighlights,
};
