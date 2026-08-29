'use client';

import { useQuery } from '@tanstack/react-query';
import { Bot, CheckCircle2, FileWarning, History, XCircle } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { ModuleLandingStatGradientCard } from '@/components/common/stat-card-metric-layout';

type IaStatsPayload = {
  proposed: number;
  approved: number;
  rejected: number;
  runsTotal: number;
  runsFailed: number;
};

export function IaStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['pilotage-supervision', 'ia', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/pilotage-supervision/ia/stats');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<IaStatsPayload>(await res.json());
    },
    staleTime: 30_000,
  });

  const proposed = data?.proposed ?? 0;
  const approved = data?.approved ?? 0;
  const rejected = data?.rejected ?? 0;
  const runsTotal = data?.runsTotal ?? 0;
  const runsFailed = data?.runsFailed ?? 0;

  return (
    <div className="grid h-full grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">
      <ModuleLandingStatGradientCard
        icon={FileWarning}
        tone="warning"
        label="Brouillons à valider"
        value={isLoading ? '…' : String(proposed)}
        detail="AiArtifact PROPOSED"
        trend={proposed > 0 ? 'up' : 'neutral'}
      />
      <ModuleLandingStatGradientCard
        icon={CheckCircle2}
        tone="success"
        label="Approuvés"
        value={isLoading ? '…' : String(approved)}
        detail={`${rejected} rejetés`}
        trend="neutral"
      />
      <ModuleLandingStatGradientCard
        icon={History}
        tone="info"
        label="Exécutions"
        value={isLoading ? '…' : String(runsTotal)}
        detail="AiRun au total"
        trend="neutral"
      />
      <ModuleLandingStatGradientCard
        icon={runsFailed > 0 ? XCircle : Bot}
        tone={runsFailed > 0 ? 'destructive' : 'primary'}
        label="Échecs"
        value={isLoading ? '…' : String(runsFailed)}
        detail="AiRun FAILED"
        trend={runsFailed > 0 ? 'down' : 'neutral'}
      />
    </div>
  );
}
