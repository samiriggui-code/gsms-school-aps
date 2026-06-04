'use client';

import { Fragment } from 'react';
import { Users, Shield, Key, UserPlus, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ModuleStatsResponse } from '@repo/api-core';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';

const ICON_MAP: Record<string, typeof Shield> = {
  Users,
  Shield,
  Key,
  UserPlus,
  Lock,
};

export function SecurityStats() {
  const { data } = useQuery({
    queryKey: ['security-dashboard-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/securite-configuration/stats');
      if (!response.ok) {
        return {
          data: { kpis: [], updatedAt: new Date().toISOString() } satisfies ModuleStatsResponse,
        };
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const statsResponse: ModuleStatsResponse =
    data?.data || { kpis: [], updatedAt: new Date().toISOString() };
  const kpis = (statsResponse.kpis || []).slice(0, 5);

  return (
    <Fragment>
      <SectionStatsCardBackgroundStyles />
      <div className={`${SECTION_LANDING_STATS_GRID_CLASS} h-full items-stretch`}>
        {kpis.map((kpi, idx) => {
          const IconComponent = ICON_MAP[kpi.icon as string] || Shield;
          return (
            <SectionLandingHexStatCard
              key={kpi.label || idx}
              icon={IconComponent}
              tone={(kpi.color as MetricStatTone) || 'primary'}
              label={kpi.label}
              value={String(kpi.value)}
              detail={kpi.trendValue || ''}
              trend={(kpi.trend as 'up' | 'down' | 'neutral') || 'neutral'}
            />
          );
        })}
      </div>
    </Fragment>
  );
}
