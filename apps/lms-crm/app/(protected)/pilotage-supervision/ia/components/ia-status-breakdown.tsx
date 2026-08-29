'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { Skeleton } from '@/components/ui/skeleton';

type IaStatsPayload = {
  proposed: number;
  approved: number;
  rejected: number;
  runsTotal: number;
  runsFailed: number;
};

const BUCKETS: { key: keyof IaStatsPayload; label: string }[] = [
  { key: 'proposed', label: 'À valider' },
  { key: 'approved', label: 'Approuvés' },
  { key: 'rejected', label: 'Rejetés' },
  { key: 'runsFailed', label: 'Runs en échec' },
];

export function IaStatusBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ['pilotage-supervision', 'ia', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/pilotage-supervision/ia/stats');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<IaStatsPayload>(await res.json());
    },
    staleTime: 30_000,
  });

  const total =
    (data?.proposed ?? 0) +
    (data?.approved ?? 0) +
    (data?.rejected ?? 0) +
    (data?.runsFailed ?? 0) ||
    1;

  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="border-b border-dashed pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Répartition artefacts / runs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : (
          BUCKETS.map((b) => {
            const count = data?.[b.key] ?? 0;
            return (
              <div key={b.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{b.label}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((count / total) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
