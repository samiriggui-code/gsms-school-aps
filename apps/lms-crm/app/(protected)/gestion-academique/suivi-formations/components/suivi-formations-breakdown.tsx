'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { Skeleton } from '@repo/ui/skeleton';

type StatsPayload = {
  surveysTotal: number;
  surveysPending: number;
  surveysCompleted: number;
  circuitsTotal: number;
  circuitsRunning: number;
  circuitsFailed: number;
};

export function SuiviFormationsBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ['gestion-academique', 'suivi-formations', 'breakdown'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/suivi-formations/stats');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<StatsPayload>(await res.json());
    },
    staleTime: 30_000,
  });

  const rows = data
    ? [
        {
          label: 'Enquêtes complétées',
          count: data.surveysCompleted,
          total: Math.max(data.surveysTotal, 1),
        },
        {
          label: 'Enquêtes en cours',
          count: data.surveysPending,
          total: Math.max(data.surveysTotal, 1),
        },
        {
          label: 'Circuits OK / total',
          count: Math.max(data.circuitsTotal - data.circuitsFailed - data.circuitsRunning, 0),
          total: Math.max(data.circuitsTotal, 1),
        },
        {
          label: 'Circuits échec',
          count: data.circuitsFailed,
          total: Math.max(data.circuitsTotal, 1),
        },
      ]
    : [];

  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="border-b border-dashed pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Répartition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : (
          rows.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{row.label}</span>
                <span className="text-muted-foreground">{row.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((row.count / row.total) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
