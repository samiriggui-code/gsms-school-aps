'use client';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { FinanceAlertRow } from '@/lib/finance/finance-alerts';
import { AlertCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@repo/ui/skeleton';
import Link from 'next/link';

const KIND_LABEL: Record<FinanceAlertRow['kind'], string> = {
  DEVIS_EXPIRED: 'Devis expiré',
  DEVIS_EXPIRING: 'Devis à échéance',
  FACTURE_UNPAID: 'Facture impayée',
  PAYMENT_PENDING: 'Paiement en attente',
};

async function fetchFinanceAlerts(): Promise<FinanceAlertRow[]> {
  const res = await apiFetch('/api/sections/administration-facturation/finance/alerts');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const data = unwrapSectionApiData<{ items: FinanceAlertRow[] }>(json);
  return data?.items ?? [];
}

export function ComplianceAlerts() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['finance-alerts'] as const,
    queryFn: fetchFinanceAlerts,
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Alertes Finance</CardTitle>
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
            <ShieldAlert className="size-4 text-destructive" />
            Alertes Finance
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium">Devis, factures impayées, paiements</p>
        </div>
        <Badge variant="outline" className="font-bold">{alerts.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="group relative bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-foreground/90 uppercase truncate">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{alert.subtitle}</p>
                    <Badge variant="outline" size="xs" className="text-[9px] font-bold uppercase tracking-tighter py-0">
                      {KIND_LABEL[alert.kind]}
                    </Badge>
                  </div>

                  <div className="text-right shrink-0">
                    {alert.dueDate ? (
                      <>
                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] font-bold ${
                            alert.severity === 'CRITICAL' ? 'text-destructive' : 'text-warning'
                          }`}
                        >
                          {alert.severity === 'CRITICAL' ? (
                            <AlertCircle className="size-3" />
                          ) : (
                            <Clock className="size-3" />
                          )}
                          {formatDistanceToNow(new Date(alert.dueDate), { addSuffix: true, locale: fr })}
                        </div>
                        <p className="text-[9px] text-muted-foreground font-medium">
                          le {new Date(alert.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>

                <Link
                  href={alert.href}
                  className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-primary/5 flex items-center justify-center transition-opacity rounded-lg"
                >
                  <ArrowRight className="size-4 text-primary" />
                </Link>
              </div>
            ))
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="size-10 bg-success/10 rounded-full flex items-center justify-center mb-2">
                <ShieldAlert className="size-5 text-success" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Aucune alerte finance</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
