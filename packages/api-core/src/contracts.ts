export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export type StatTrend = 'up' | 'down' | 'neutral';

export interface StatKpiCard {
  label: string;
  value: string | number;
  trend?: StatTrend;
  trendValue?: string;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}

export interface MonthlyEvolution {
  date: string;
  count: number;
}

export interface CategoryDistribution {
  name: string;
  count: number;
}

export interface ModuleStatsResponse {
  kpis: StatKpiCard[];
  monthlyEvolution?: MonthlyEvolution[];
  categoryDistribution?: CategoryDistribution[];
  updatedAt: string;
}
