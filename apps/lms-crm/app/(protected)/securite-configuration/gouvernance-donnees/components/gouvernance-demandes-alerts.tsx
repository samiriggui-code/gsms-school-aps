'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Skeleton } from '@repo/ui/skeleton';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';

type DemandeAlert = {
  id: string;
  candidat: string;
  missingPieces: string;
  missingCount: number;
  gedPath: string;
};

type DashboardResponse = {
  stats: { missingDocumentsDemandes: number };
  demandesAlerts: DemandeAlert[];
};

export function GouvernanceDemandesAlerts() {
  const { data, isLoading } = useQuery({
    queryKey: ['gouvernance-dashboard-demandes-alerts'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/securite-configuration/gouvernance-donnees/dashboard',
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Dashboard load failed');
      return unwrapSectionApiData<DashboardResponse>(json);
    },
    staleTime: 60_000,
  });

  const urgent = (data?.demandesAlerts ?? []).filter((a) => a.missingCount > 0).slice(0, 5);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Alertes documentaires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <FileWarning className="size-4 text-destructive" />
            Alertes documentaires
          </CardTitle>
          <p className="text-xs text-muted-foreground">Candidats avec pièces manquantes</p>
        </div>
        <Badge variant="outline">{data?.stats.missingDocumentsDemandes ?? 0}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {urgent.length > 0 ? (
            urgent.map((alert) => (
              <Link
                key={alert.id}
                href={alert.gedPath}
                className="group block rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{alert.candidat}</p>
                    <p className="mt-0.5 text-xs text-destructive">{alert.missingPieces}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Aucune pièce manquante signalée.
            </p>
          )}
        </div>
        <Link
          href="/securite-configuration/gouvernance-donnees/demandes-documents"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Voir toutes les demandes
          <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
