'use client';

import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight, Clock, Clock3, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEquipmentDashboardStats } from '@/lib/hooks/gestion-ressources/equipements/use-dashboard-stats';
import { fetchModuleAlerts, type ModuleAlertItem } from '@/lib/module-alerts-api';

const MODULE_KEY = 'gestion-ressources.equipements';

function severityClass(severity: ModuleAlertItem['severity']) {
  if (severity === 'CRITICAL') return 'text-destructive';
  if (severity === 'WARNING') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

export function EquipmentAlerts() {
  const { data, isLoading } = useEquipmentDashboardStats();
  const eventsQuery = useQuery({
    queryKey: ['module-alerts', MODULE_KEY],
    queryFn: () => fetchModuleAlerts(MODULE_KEY, 8),
    refetchInterval: 60_000,
  });

  const status =
    data?.data?.statusCounts ||
    data?.data?.categoryDistribution?.map((item) => ({
      status: item.name,
      count: item.count,
    })) ||
    [];
  const maintenance = status.find((s) => s.status === 'MAINTENANCE')?.count || 0;
  const outOfService = status.find((s) => s.status === 'OUT_OF_SERVICE')?.count || 0;
  const inUse = status.find((s) => s.status === 'IN_USE')?.count || 0;
  const totalAlerts = maintenance + outOfService;
  const events = eventsQuery.data?.items ?? [];

  if (isLoading) {
    return (
      <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
        <CardHeader className="pb-3 border-b border-dashed">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Alertes équipements</CardTitle>
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
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-dashed">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="size-4 text-destructive" />
            Alertes équipements
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium">
            Parc matériel, salles et événements récents
          </p>
        </div>
        <Badge variant="outline" className="font-bold">
          {totalAlerts + events.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <AlertTriangle className="size-3.5 text-amber-500" />
              En maintenance
            </div>
            <Badge variant="warning" appearance="light">{maintenance}</Badge>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <ShieldAlert className="size-3.5 text-rose-500" />
              Hors service
            </div>
            <Badge variant={outOfService > 0 ? 'destructive' : 'success'} appearance="light">{outOfService}</Badge>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase">
              <Clock3 className="size-3.5 text-indigo-500" />
              En service
            </div>
            <Badge variant="secondary" appearance="light">{inUse}</Badge>
          </div>
        </div>

        {eventsQuery.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : events.length > 0 ? (
          <div className="space-y-2 pt-1 border-t border-dashed border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-2">
              Événements récents
            </p>
            {events.map((alert) => (
              <ModuleAlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        ) : null}

        <Link
          href="/account/notifications"
          className="inline-flex text-xs font-semibold text-primary hover:underline"
        >
          Voir toutes les notifications
        </Link>
      </CardContent>
    </Card>
  );
}

function ModuleAlertRow({ alert }: { alert: ModuleAlertItem }) {
  const timeLabel = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true,
    locale: fr,
  });
  const href = alert.href ?? '/gestion-ressources/equipements/salles';

  return (
    <div className="group relative bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground/90 line-clamp-2">{alert.title}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2">{alert.body}</p>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-[10px] font-bold shrink-0',
            severityClass(alert.severity),
          )}
        >
          <Clock className="size-3" />
          {timeLabel}
        </div>
      </div>
      <Link
        href={href}
        className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-primary/5 flex items-center justify-center transition-opacity rounded-lg"
        aria-label={alert.title}
      >
        <ArrowRight className="size-4 text-primary" />
      </Link>
    </div>
  );
}
