'use client';

import { Fragment } from 'react';
import { Users, FileCheck, Shield, HardDrive, Activity } from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { Card, CardContent } from '@repo/ui/card';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';

interface ApiStat {
  value: number | string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  label: string;
}

interface ApiResponseData {
  activeUsers?: ApiStat;
  pendingInvoices?: ApiStat;
  totalRoles?: ApiStat;
  storageQuota?: ApiStat;
  systemLogs?: ApiStat;
}

interface AdminStatsDynamicProps {
  data?: ApiResponseData;
  isLoading?: boolean;
}

const getStat = (data: ApiResponseData | undefined, ...keys: string[]): ApiStat => {
  if (!data) return { label: 'N/A', value: 'N/A', trend: 'neutral', trendValue: '0%' };
  for (const key of keys) {
    const candidate = data[key as keyof ApiResponseData];
    if (candidate?.label !== undefined) return candidate;
  }
  return { label: 'N/A', value: 'N/A', trend: 'neutral', trendValue: '0%' };
};

export function AdminStatsDynamic({ data, isLoading }: AdminStatsDynamicProps = {}) {
  const activeUsers = getStat(data, 'activeUsers');
  const pendingInvoices = getStat(data, 'pendingInvoices');
  const totalRoles = getStat(data, 'totalRoles');
  const storageQuota = getStat(data, 'storageQuota');
  const systemLogs = getStat(data, 'systemLogs');

  const stats = [
    {
      icon: Users,
      label: activeUsers.label || 'Clients actifs',
      value: String(activeUsers.value),
      trend: activeUsers.trend as 'up' | 'down' | 'neutral',
      trendValue: activeUsers.trendValue,
      color: 'primary' as MetricStatTone,
    },
    {
      icon: FileCheck,
      label: pendingInvoices.label || 'Factures en attente',
      value: String(pendingInvoices.value),
      trend: pendingInvoices.trend as 'up' | 'down' | 'neutral',
      trendValue: pendingInvoices.trendValue,
      color: 'success' as MetricStatTone,
    },
    {
      icon: Shield,
      label: totalRoles.label || 'Abonnements',
      value: String(totalRoles.value),
      trend: totalRoles.trend as 'up' | 'down' | 'neutral',
      trendValue: totalRoles.trendValue,
      color: 'warning' as MetricStatTone,
    },
    {
      icon: HardDrive,
      label: storageQuota.label || 'Stockage',
      value: String(storageQuota.value),
      trend: storageQuota.trend as 'up' | 'down' | 'neutral',
      trendValue: storageQuota.trendValue,
      color: 'info' as MetricStatTone,
    },
    {
      icon: Activity,
      label: systemLogs.label || 'Transactions',
      value: String(systemLogs.value),
      trend: systemLogs.trend as 'up' | 'down' | 'neutral',
      trendValue: systemLogs.trendValue,
      color: 'destructive' as MetricStatTone,
    },
  ];

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
        {stats.map((stat, index) => (
          <SectionLandingHexStatCard
            key={index}
            icon={stat.icon}
            tone={stat.color}
            label={stat.label}
            value={stat.value}
            detail={stat.trendValue}
            trend={stat.trend}
          />
        ))}
      </div>
    </Fragment>
  );
}
