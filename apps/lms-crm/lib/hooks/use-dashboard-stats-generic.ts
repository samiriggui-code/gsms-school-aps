import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type DashboardStatsModule = 'dashboard' | 'pilotage' | 'equipment' | 'rh';

const STATS_ENDPOINTS: Record<DashboardStatsModule, string> = {
  dashboard: '/api/common/stats',
  pilotage: '/api/common/stats',
  equipment: '/api/sections/gestion-ressources/stats',
  rh: '/api/sections/gestion-ressources/stats',
};

/** Aggregated KPIs used by dashboard widgets (nested keys are optional if API evolves). */
export type AggregatedGsmsDashboardData = {
  administration?: { totalUsers?: number };
  sites?: { activeSites?: number; activeClients?: number };
  rh?: { activeEmployees?: number };
  /** Champs plats renvoyés par /api/common/stats (pilotage) */
  activeSites?: number;
  activeAgents?: number;
  activeEmployees?: number;
  mcEntriesToday?: number;
  currentAlerts?: number;
  activeClients?: number;
};

type StatsResponse = {
  success?: boolean;
  /** Primary dashboard payload; endpoints may include additional fields. */
  data?: AggregatedGsmsDashboardData | null;
};

async function fetchDashboardStats(moduleName: DashboardStatsModule): Promise<StatsResponse> {
  const endpoint = STATS_ENDPOINTS[moduleName];
  const response = await apiFetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return { success: false, data: null };
  }

  return response.json();
}

export function useDashboardStats(moduleName: DashboardStatsModule) {
  return useQuery({
    queryKey: ['dashboard-stats', moduleName],
    queryFn: () => fetchDashboardStats(moduleName),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

