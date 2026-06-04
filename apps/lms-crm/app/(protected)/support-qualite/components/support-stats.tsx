'use client';

import { Fragment } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportQualiteStats } from '../hooks/use-support-qualite-stats';

const ICON_MAP: Record<string, typeof MessageSquare> = {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
};

export function SupportStats() {
  const { kpis, isLoading } = useSupportQualiteStats();

  if (isLoading) {
    return (
      <div className={SECTION_LANDING_STATS_GRID_CLASS}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-0 h-full min-h-[120px]">
              <StatCardMetricLayout iconSlot={<Skeleton className="size-12 shrink-0 rounded-lg" />}>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-16" />
              </StatCardMetricLayout>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Fragment>
      <SectionStatsCardBackgroundStyles />
      <div className={`${SECTION_LANDING_STATS_GRID_CLASS} h-full items-stretch`}>
        {kpis.map((kpi, idx) => {
          const IconComponent = ICON_MAP[kpi.icon as string] || MessageSquare;
          return (
            <SectionLandingHexStatCard
              key={kpi.label || idx}
              icon={IconComponent}
              tone={(kpi.color as MetricStatTone) || 'primary'}
              label={kpi.label}
              value={String(kpi.value)}
              detail={kpi.trendValue || '—'}
              trend={(kpi.trend as 'up' | 'down' | 'neutral') || 'neutral'}
            />
          );
        })}
      </div>
    </Fragment>
  );
}
