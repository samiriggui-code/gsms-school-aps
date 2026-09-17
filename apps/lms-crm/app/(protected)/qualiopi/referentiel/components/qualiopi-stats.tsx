'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { ModuleLandingStatGradientCard } from '@/components/common/stat-card-metric-layout';

type QualiopiBootstrap = {
  summary: { completenessPct: number; status: string };
  items: { status: string }[];
};

export function QualiopiStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['gestion-ressources', 'qualiopi', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<QualiopiBootstrap>(await res.json());
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

  const items = data.items ?? [];
  const ko = items.filter((i) => i.status === 'REJECTED').length;
  const toTreat = items.filter((i) => !['VALIDATED', 'WAIVED'].includes(i.status)).length;
  const validated = items.filter((i) => i.status === 'VALIDATED').length;

  return (
    <div className="grid h-full grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">
      <ModuleLandingStatGradientCard
        icon={ShieldCheck}
        tone="success"
        label="Complétude classeur"
        value={`${data.summary.completenessPct}%`}
        detail={`${items.length} indicateurs V.9`}
        trend="neutral"
      />
      <ModuleLandingStatGradientCard
        icon={ShieldCheck}
        tone="info"
        label="À traiter"
        value={String(toTreat)}
        detail={`${ko} non conformes (KO)`}
        trend={ko > 0 ? 'down' : 'neutral'}
      />
      <ModuleLandingStatGradientCard
        icon={CheckCircle2}
        tone="primary"
        label="Validés"
        value={String(validated)}
        detail={`sur ${items.length} indicateurs`}
        trend="up"
      />
      <ModuleLandingStatGradientCard
        icon={AlertCircle}
        tone="destructive"
        label="Écarts"
        value={String(ko)}
        detail="Non conformes (KO)"
        trend={ko > 0 ? 'down' : 'neutral'}
      />
    </div>
  );
}
