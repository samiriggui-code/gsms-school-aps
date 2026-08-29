'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ClipboardList, Workflow } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { Skeleton } from '@/components/ui/skeleton';

type StatsPayload = {
  surveysPending: number;
  circuitsFailed: number;
  circuitsRunning: number;
};

export function SuiviFormationsAlerts() {
  const { data, isLoading } = useQuery({
    queryKey: ['gestion-academique', 'suivi-formations', 'alerts'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/suivi-formations/stats');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<StatsPayload>(await res.json());
    },
    staleTime: 30_000,
  });

  const pending = data?.surveysPending ?? 0;
  const failed = data?.circuitsFailed ?? 0;
  const running = data?.circuitsRunning ?? 0;

  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Alertes suivi</CardTitle>
        <AlertTriangle className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border p-2.5">
              <div className="flex items-center gap-2 text-sm">
                <ClipboardList className="size-4 text-muted-foreground" />
                Enquêtes en attente
              </div>
              <Badge variant={pending > 0 ? 'warning' : 'secondary'}>{pending}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border p-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Workflow className="size-4 text-muted-foreground" />
                Circuits en cours
              </div>
              <Badge variant="info">{running}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border p-2.5">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4 text-destructive" />
                Circuits en échec
              </div>
              <Badge variant={failed > 0 ? 'destructive' : 'secondary'}>{failed}</Badge>
            </div>
          </>
        )}
        <Link
          href="/gestion-academique/suivi-formations/tableau"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Tableau de suivi <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
