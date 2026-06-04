'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { 
  Package, 
  CheckCircle, 
  Settings, 
  AlertTriangle,
  PackageCheck,
  Wrench
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ModuleStatsResponse } from '@repo/api-core';

export function EquipmentStats() {
  const { data } = useQuery({
    queryKey: ['equipment-dashboard-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/equipements/stats?days=30');
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
          Package,
          CheckCircle,
          Settings,
          AlertTriangle,
          PackageCheck,
          Wrench
        } as any)[kpi.icon as string] || Package;

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
