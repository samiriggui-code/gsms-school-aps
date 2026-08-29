'use client';

import { useQuery } from '@tanstack/react-query';
import { LeafScaffoldPage, type LeafScaffoldStat } from '@/components/common/leaf-scaffold-page';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type IaStatsPayload = {
  proposed: number;
  approved: number;
  rejected: number;
  runsTotal: number;
  runsFailed: number;
};

type IaLeafScaffoldProps = {
  path: string;
  chantierId: string;
  summary: string;
  nextSteps: string[];
  mode: 'brouillons' | 'historique';
};

export function IaLeafScaffold({
  path,
  chantierId,
  summary,
  nextSteps,
  mode,
}: IaLeafScaffoldProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pilotage-supervision', 'ia', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/pilotage-supervision/ia/stats');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<IaStatsPayload>(await res.json());
    },
    staleTime: 30_000,
  });

  const v = (n: number | undefined) => (isLoading ? '…' : String(n ?? 0));

  const stats: LeafScaffoldStat[] =
    mode === 'brouillons'
      ? [
          { label: 'À valider', value: v(data?.proposed), detail: 'PROPOSED' },
          { label: 'Approuvés', value: v(data?.approved), detail: 'APPROVED' },
          { label: 'Rejetés', value: v(data?.rejected), detail: 'REJECTED' },
        ]
      : [
          { label: 'Exécutions', value: v(data?.runsTotal), detail: 'AiRun' },
          { label: 'Échecs', value: v(data?.runsFailed), detail: 'FAILED' },
          { label: 'À valider', value: v(data?.proposed), detail: 'PROPOSED' },
        ];

  return (
    <LeafScaffoldPage
      path={path}
      chantierId={chantierId}
      summary={summary}
      nextSteps={nextSteps}
      stats={stats}
      backHref="/pilotage-supervision/ia"
    />
  );
}
