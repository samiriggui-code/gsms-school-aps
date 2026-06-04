'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Users, ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ModuleStatsResponse } from '@repo/api-core';

export function RHStats() {
  const { data } = useQuery({
    queryKey: ['rh-dashboard-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs/stats?months=12');
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
  const kpis = statsResponse.kpis || [];

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-2 lg:gap-8 h-full items-stretch">
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
