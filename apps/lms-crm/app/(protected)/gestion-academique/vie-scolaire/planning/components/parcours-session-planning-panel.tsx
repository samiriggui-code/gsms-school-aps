'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

type PlanningRow = {
  id: string;
  dateDisplayLabel: string;
  startDate: string | null;
  endDate: string | null;
  formation: { name: string } | null;
  participantsCount: number;
};

export function ParcoursSessionPlanningPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['vie-scolaire', 'planning'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/planning');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return body.data as { items: PlanningRow[] };
    },
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions à venir (6 semaines)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune session planifiée sur la période.</p>
        ) : (
          items.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-1 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.formation?.name ?? 'Formation'}</p>
                <p className="text-sm text-muted-foreground">{row.dateDisplayLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{row.participantsCount} inscrit(s)</Badge>
                <Link
                  href="/gestion-academique/vie-scolaire/sessions"
                  className="text-sm text-primary hover:underline"
                >
                  Ouvrir sessions
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
