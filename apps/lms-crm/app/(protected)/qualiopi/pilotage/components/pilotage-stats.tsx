'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Activity, Users, Clock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { useModuleWorkspaceQuery } from '@/hooks/use-module-workspace-query';
import { useTranslation } from '@/hooks/useTranslation';
import { workspaceStatLabel } from '@/lib/workspace-labels';

const ICONS = [Activity, Users, Clock, AlertTriangle] as const;
const TONES: MetricStatTone[] = ['primary', 'success', 'warning', 'destructive'];

export function PilotageStats() {
  const { t } = useTranslation();
  const { data, isLoading } = useModuleWorkspaceQuery({
    viewKey: 'pilotage-alertes',
    page: 1,
    limit: 1,
  });

  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-2 items-stretch gap-5 md:grid-cols-2 lg:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const kpis = (data?.kpis ?? []).slice(0, 4);

  return (
    <div className="grid h-full grid-cols-2 items-stretch gap-5 md:grid-cols-2 lg:gap-8">
      {kpis.map((stat, index) => {
        const Icon = ICONS[index % ICONS.length];
        const statKey = stat.key ?? String(index);
        const label = workspaceStatLabel(t, 'pilotage-alertes', statKey, 'label', undefined, stat.label);
        const detail =
          stat.subtitle ?
            workspaceStatLabel(t, 'pilotage-alertes', statKey, 'subtitle', undefined, stat.subtitle)
          : '—';
        return (
          <ModuleLandingStatGradientCard
            key={statKey}
            icon={Icon}
            tone={TONES[index % TONES.length]}
            label={label}
            value={String(stat.value)}
            detail={detail}
            trend="neutral"
          />
        );
      })}
    </div>
  );
}
