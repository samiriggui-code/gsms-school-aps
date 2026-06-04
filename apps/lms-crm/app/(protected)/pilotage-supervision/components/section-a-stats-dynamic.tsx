'use client';

import { Fragment, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getIcon } from '@/lib/icons';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';

interface PilotageStat {
  icon: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  tone: MetricStatTone;
}

interface ApiStat {
  value: number | string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  label: string;
  icon?: string;
}

type DashboardStatsPayload = Record<string, ApiStat | undefined> & {
  operationalPerformance?: ApiStat;
  riskLevel?: ApiStat;
  responseTime?: ApiStat;
  satisfaction?: ApiStat;
  teams?: ApiStat;
};

interface PilotageStatsDynamicProps {
  data?: DashboardStatsPayload | null;
  loading?: boolean;
}

const FALLBACK_STAT = (label: string, icon: string): ApiStat => ({
  label,
  value: '—',
  trend: 'neutral',
  trendValue: '—',
  icon,
});

function pickStat(
  data: DashboardStatsPayload,
  primary: keyof DashboardStatsPayload,
  fallback: keyof DashboardStatsPayload,
  defaultLabel: string,
  defaultIcon: string,
): ApiStat {
  const stat = data[primary] ?? data[fallback];
  if (stat && typeof stat === 'object' && 'label' in stat && 'value' in stat) {
    return stat;
  }
  return FALLBACK_STAT(defaultLabel, defaultIcon);
}

function buildStatsFromPayload(data: DashboardStatsPayload): PilotageStat[] {
  const defs: Array<{
    stat: ApiStat;
    tone: MetricStatTone;
    icon: string;
  }> = [
    {
      stat: pickStat(data, 'operationalPerformance', 'availableAgents', 'Performance opérationnelle', 'Shield'),
      tone: 'primary',
      icon: 'Shield',
    },
    {
      stat: pickStat(data, 'riskLevel', 'brokenEquipments', 'Niveau de risque', 'AlertTriangle'),
      tone: 'destructive',
      icon: 'AlertTriangle',
    },
    {
      stat: pickStat(data, 'responseTime', 'serviceHours', 'Temps de réponse', 'Clock'),
      tone: 'warning',
      icon: 'Clock',
    },
    {
      stat: pickStat(data, 'satisfaction', 'operationalVehicles', 'Satisfaction', 'CheckCircle'),
      tone: 'success',
      icon: 'CheckCircle',
    },
    {
      stat: pickStat(data, 'teams', 'activeTeams', 'Équipes', 'Users'),
      tone: 'info',
      icon: 'Users',
    },
  ];

  return defs.map(({ stat, tone, icon }) => ({
    icon: stat.icon || icon,
    label: stat.label,
    value: String(stat.value),
    trend: stat.trend ?? 'neutral',
    trendValue: stat.trendValue ?? '—',
    tone,
  }));
}

export function PilotageStatsDynamic({ data, loading = false }: PilotageStatsDynamicProps) {
  const [stats, setStats] = useState<PilotageStat[]>([]);

  useEffect(() => {
    if (data && typeof data === 'object') {
      setStats(buildStatsFromPayload(data));
    } else {
      setStats([]);
    }
  }, [data]);

  if (loading && !data) {
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

  if (!loading && stats.length === 0) {
    return null;
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
              tone={stat.tone}
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
