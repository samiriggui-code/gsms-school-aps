'use client';

import { Fragment } from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Loader2 } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { Skeleton } from '@repo/ui/skeleton';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';

interface RessourcesStat {
  icon: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: MetricStatTone;
}

interface ApiStat {
  value: number | string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  label: string;
  icon?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    availableAgents: ApiStat;
    activeTeams: ApiStat;
    brokenEquipments: ApiStat;
    operationalVehicles: ApiStat;
    serviceHours: ApiStat;
  };
}

interface RessourcesStatsDynamicProps {
  data?: ApiResponse['data'];
  isLoading?: boolean;
}

export function RessourcesStatsDynamic({ data, isLoading }: RessourcesStatsDynamicProps) {
  const statsData = data;

  const stats: RessourcesStat[] = statsData
    ? [
        {
          icon: statsData.availableAgents.icon || 'Users',
          label: statsData.availableAgents.label,
          value: String(statsData.availableAgents.value),
          trend: statsData.availableAgents.trend,
          trendValue: statsData.availableAgents.trendValue,
          color: 'primary',
        },
        {
          icon: statsData.activeTeams.icon || 'Users',
          label: statsData.activeTeams.label,
          value: String(statsData.activeTeams.value),
          trend: statsData.activeTeams.trend,
          trendValue: statsData.activeTeams.trendValue,
          color: 'success',
        },
        {
          icon: statsData.brokenEquipments.icon || 'AlertTriangle',
          label: statsData.brokenEquipments.label,
          value: String(statsData.brokenEquipments.value),
          trend: statsData.brokenEquipments.trend,
          trendValue: statsData.brokenEquipments.trendValue,
          color: 'destructive',
        },
        {
          icon: statsData.operationalVehicles.icon || 'CheckCircle',
          label: statsData.operationalVehicles.label,
          value: String(statsData.operationalVehicles.value),
          trend: statsData.operationalVehicles.trend,
          trendValue: statsData.operationalVehicles.trendValue,
          color: 'info',
        },
        {
          icon: statsData.serviceHours.icon || 'Clock',
          label: statsData.serviceHours.label,
          value: String(statsData.serviceHours.value),
          trend: statsData.serviceHours.trend,
          trendValue: statsData.serviceHours.trendValue,
          color: 'warning',
        },
      ]
    : [];

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
      <div className={SECTION_LANDING_STATS_GRID_CLASS}>
        {stats.map((stat, index) => {
          const Icon = getIcon(stat.icon);
          return (
            <SectionLandingHexStatCard
              key={index}
              icon={Icon}
              tone={stat.color}
              label={stat.label}
              value={stat.value}
              detail={stat.trendValue}
              trend={stat.trend}
            />
          );
        })}
      </div>
    </Fragment>
  );
}
