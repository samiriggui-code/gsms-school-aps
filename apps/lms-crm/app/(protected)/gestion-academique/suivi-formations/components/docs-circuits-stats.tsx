'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Workflow, Loader2 } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { ModuleLandingStatGradientCard } from '@/components/common/stat-card-metric-layout';

type DocsCircuitsStatsData = {
  surveysTotal: number;
  surveysPending: number;
  surveysCompleted: number;
  circuitsTotal: number;
  circuitsRunning: number;
  circuitsFailed: number;
};

export function DocsCircuitsStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['gestion-academique', 'suivi-formations', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/suivi-formations/stats');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<DocsCircuitsStatsData>(await res.json());
    },
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">
      <ModuleLandingStatGradientCard
        icon={ClipboardList}
        tone="info"
        label="Enquêtes satisfaction"
        value={String(data.surveysTotal)}
        detail={`${data.surveysCompleted} complétées · ${data.surveysPending} en cours`}
        trend="neutral"
      />
      <ModuleLandingStatGradientCard
        icon={Workflow}
        tone="info"
        label="Circuits session"
        value={String(data.circuitsTotal)}
        detail={`${data.circuitsRunning} en cours · ${data.circuitsFailed} échecs`}
        trend={data.circuitsFailed > 0 ? 'down' : 'neutral'}
      />
    </div>
  );
}
