'use client';

import { Users, ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import { useSectionHubStats } from '@/hooks/use-section-hub-stats';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ModuleLandingStatGradientCard,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import type { ModuleStatsResponse } from '@repo/api-core';

interface CompagnieStatsProps {
  variant?: 'grid' | 'row';
}

export function CompagnieStats({ variant = 'grid' }: CompagnieStatsProps) {
  const { data: statsApi = {} } = useSectionHubStats('compagnie', 12);

  const statsResponse: ModuleStatsResponse =
    data?.data || { kpis: [], updatedAt: new Date().toISOString() };
  const kpis = statsResponse.kpis || [];

  const gridClasses =
    variant === 'row'
      ? 'grid grid-cols-2 md:grid-cols-2 gap-5 lg:gap-8 w-full'
      : 'grid grid-cols-2 md:grid-cols-2 gap-5 lg:gap-8 h-full items-stretch';

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4].map((index) => (
          <Card key={`skeleton-${index}`} className="border border-border/70 shadow-none">
            <CardContent className="p-0">
              <StatCardMetricLayout iconSlot={<Skeleton className="size-10 shrink-0 rounded-lg" />}>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-20" />
              </StatCardMetricLayout>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {kpis.map((kpi, idx) => {
        const IconComponent = ({
          Users,
          ShieldCheck,
          Calendar,
          AlertTriangle,
        } as any)[kpi.icon as string] || Users;

        return (
          <ModuleLandingStatGradientCard
            key={kpi.label || idx}
            icon={IconComponent}
            tone={kpi.color as MetricStatTone}
            label={kpi.label}
            value={String(kpi.value)}
            detail={kpi.trendValue || ''}
            trend={(kpi.trend as any) || 'neutral'}
          />
        );
      })}
    </div>
  );
}
