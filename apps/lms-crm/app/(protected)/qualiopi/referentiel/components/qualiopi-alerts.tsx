'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { Skeleton } from '@repo/ui/skeleton';

type QualiopiBootstrap = {
  items: { id: string; code: string; label: string; status: string }[];
};

export function QualiopiAlerts() {
  const { data, isLoading } = useQuery({
    queryKey: ['gestion-ressources', 'qualiopi', 'alerts'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<QualiopiBootstrap>(await res.json());
    },
    staleTime: 30_000,
  });

  const critical = (data?.items ?? [])
    .filter((i) => i.status === 'REJECTED' || i.status === 'EXPIRED')
    .slice(0, 5);

  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Alertes Qualiopi</CardTitle>
        <ShieldAlert className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : critical.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun KO / expiré pour le moment.</p>
        ) : (
          critical.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-dashed border-border p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {item.code} — {item.label}
                </p>
                <Badge variant="destructive" className="mt-1">
                  {item.status === 'EXPIRED' ? 'Expiré' : 'KO'}
                </Badge>
              </div>
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
            </div>
          ))
        )}
        <Link
          href="/qualiopi/referentiel/classeur"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ouvrir le classeur <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
