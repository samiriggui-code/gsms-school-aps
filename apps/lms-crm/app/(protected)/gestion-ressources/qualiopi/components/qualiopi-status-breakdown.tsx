'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { Skeleton } from '@/components/ui/skeleton';

type QualiopiBootstrap = {
  items: { status: string }[];
};

const BUCKETS: { key: string; label: string; match: string[] }[] = [
  { key: 'ok', label: 'OK', match: ['VALIDATED'] },
  { key: 'ko', label: 'KO', match: ['REJECTED'] },
  { key: 'fix', label: 'À réparer', match: ['REQUESTED', 'MISSING'] },
  { key: 'na', label: 'N/A', match: ['WAIVED'] },
  { key: 'other', label: 'Autres', match: ['RECEIVED', 'EXPIRED'] },
];

export function QualiopiStatusBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ['gestion-ressources', 'qualiopi', 'breakdown'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<QualiopiBootstrap>(await res.json());
    },
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const total = items.length || 1;
  const counts = BUCKETS.map((b) => ({
    ...b,
    count: items.filter((i) => b.match.includes(i.status)).length,
  }));

  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="border-b border-dashed pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Répartition statuts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : (
          counts.map((b) => (
            <div key={b.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="text-muted-foreground">{b.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((b.count / total) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
