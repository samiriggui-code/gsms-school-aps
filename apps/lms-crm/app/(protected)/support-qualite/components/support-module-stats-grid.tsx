'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportQualiteStats } from '../hooks/use-support-qualite-stats';

const ICON_MAP: Record<string, typeof MessageSquare> = {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
};

/** 4 KPIs support/qualité — données `/api/sections/support-qualite/stats`. */
export function SupportModuleStatsGrid() {
  const { kpis, isLoading, isError } = useSupportQualiteStats();
  const cards = kpis.slice(0, 4);

  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-2 items-stretch gap-5 md:grid-cols-2 lg:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="min-h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2 items-stretch gap-5 md:grid-cols-2 lg:gap-8">
      {cards.map((kpi, idx) => {
        const Icon = ICON_MAP[kpi.icon as string] || MessageSquare;
        return (
          <ModuleLandingStatGradientCard
            key={kpi.label || idx}
            icon={Icon}
            tone={(kpi.color as MetricStatTone) || 'primary'}
            label={kpi.label}
            value={String(kpi.value)}
            detail={kpi.trendValue || (isError ? '—' : String(kpi.value))}
            trend={(kpi.trend as 'up' | 'down' | 'neutral') || 'neutral'}
          />
        );
      })}
    </div>
  );
}
