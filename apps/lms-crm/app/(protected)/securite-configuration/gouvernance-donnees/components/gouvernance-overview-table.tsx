'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Database, ExternalLink, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Skeleton } from '@repo/ui/skeleton';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type DemandeAlert = {
  id: string;
  userId: string;
  candidat: string;
  formation: string;
  status: string;
  missingPieces: string;
  missingCount: number;
  editPath: string;
  gedPath: string;
};

type DashboardResponse = {
  demandesAlerts: DemandeAlert[];
};

const STATUS_LABEL: Record<string, string> = {
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
};

export function GouvernanceOverviewTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['gouvernance-dashboard-alerts'],
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

  const rows = data?.demandesAlerts ?? [];

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed pb-3">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Demandes à traiter
          </CardTitle>
          <p className="text-xs text-muted-foreground">Pièces manquantes et validation en cours</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/securite-configuration/gouvernance-donnees/demandes-documents">
            Tout voir
            <ArrowRight className="ms-1 size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Aucune demande urgente pour le moment.
          </p>
        ) : (
          <div className="divide-y">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.candidat}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.formation}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-2xs">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                    <span
                      className={`inline-flex items-center gap-1 text-2xs ${
                        row.missingCount > 0 ? 'text-destructive' : 'text-success'
                      }`}
                    >
                      <FileWarning className="size-3" />
                      {row.missingPieces}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={row.gedPath}>
                      <Database className="size-3.5" />
                      Dossier GED
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={row.editPath}>
                      CRM
                      <ExternalLink className="ms-1 size-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
