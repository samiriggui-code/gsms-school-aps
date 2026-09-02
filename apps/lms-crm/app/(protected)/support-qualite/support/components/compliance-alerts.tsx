'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { AlertTriangle, LifeBuoy, ArrowRight } from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type UrgentItem = {
  id: string;
  kind: 'ticket' | 'incident';
  reference: string;
  title: string;
  severity: string;
  href: string;
};

export function ComplianceAlerts() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['support-urgent-alerts'],
    queryFn: async (): Promise<UrgentItem[]> => {
      const [ticketsRes, incidentsRes] = await Promise.all([
        apiFetch('/api/sections/support-qualite/support/tickets?limit=50&status=OPEN'),
        apiFetch('/api/sections/support-qualite/support/incidents?limit=50'),
      ]);
      const items: UrgentItem[] = [];

      if (ticketsRes.ok) {
        const json = await ticketsRes.json();
        const tickets = unwrapSectionApiData<{ items: { id: string; referenceCode: string; subject: string; priority: string }[] }>(json);
        for (const t of tickets?.items ?? []) {
          if (t.priority === 'HIGH' || t.priority === 'URGENT') {
            items.push({
              id: t.id,
              kind: 'ticket',
              reference: t.referenceCode,
              title: t.subject,
              severity: t.priority,
              href: `/support-qualite/support/tickets?ticket=${t.id}`,
            });
          }
        }
      }

      if (incidentsRes.ok) {
        const json = await incidentsRes.json();
        const incidents = unwrapSectionApiData<{ items: { id: string; referenceCode: string; title: string; severity: string; status: string }[] }>(json);
        for (const i of incidents?.items ?? []) {
          if (
            (i.severity === 'HIGH' || i.severity === 'CRITICAL') &&
            i.status !== 'RESOLVED' &&
            i.status !== 'CLOSED'
          ) {
            items.push({
              id: i.id,
              kind: 'incident',
              reference: i.referenceCode,
              title: i.title,
              severity: i.severity,
              href: `/support-qualite/support/incidents?incident=${i.id}`,
            });
          }
        }
      }

      return items.slice(0, 8);
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase">À traiter en priorité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="pb-3 flex flex-row border-b border-dashed items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            À traiter en priorité
          </CardTitle>
          <p className="text-xs text-muted-foreground">Tickets urgents et incidents critiques</p>
        </div>
        <Badge variant="outline" className="font-bold">{alerts.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <Link
                key={`${alert.kind}-${alert.id}`}
                href={alert.href}
                className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/30 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {alert.kind === 'ticket' ? (
                      <LifeBuoy className="size-3.5 text-primary shrink-0" />
                    ) : (
                      <AlertTriangle className="size-3.5 text-destructive shrink-0" />
                    )}
                    <span className="font-mono text-2xs text-muted-foreground">{alert.reference}</span>
                  </div>
                  <p className="text-xs font-medium truncate">{alert.title}</p>
                  <Badge variant="outline" className="text-2xs uppercase">
                    {alert.kind === 'ticket' ? 'Ticket' : 'Incident'} · {alert.severity}
                  </Badge>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
              </Link>
            ))
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-muted-foreground">Aucune urgence en cours</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
