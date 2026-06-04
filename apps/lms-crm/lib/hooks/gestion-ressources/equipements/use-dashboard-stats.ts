'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

import type { ModuleStatsResponse } from '@repo/api-core';

export type EquipmentStatusCount = {
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | string;
  count: number;
};

export type DashboardStatsResponse = {
  success: boolean;
  data: ModuleStatsResponse & {
    statusCounts?: EquipmentStatusCount[];
  };
};

const EMPTY_STATS: DashboardStatsResponse = {
  success: true,
  data: {
    kpis: [],
    monthlyEvolution: [],
    categoryDistribution: [],
    statusCounts: [],
    updatedAt: new Date().toISOString(),
  },
};

export function useEquipmentDashboardStats() {
  return useQuery({
    queryKey: ['equipment-dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await apiFetch('/api/sections/gestion-ressources/equipements/stats?days=30');
        if (!response.ok) return EMPTY_STATS;
        const json = await response.json();
        if (json && typeof json === 'object' && 'data' in json) {
          return json as DashboardStatsResponse;
        }
        return EMPTY_STATS;
      } catch {
        return EMPTY_STATS;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}
