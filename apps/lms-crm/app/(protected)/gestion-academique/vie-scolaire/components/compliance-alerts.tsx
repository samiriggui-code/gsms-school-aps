'use client';

import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { fetchModuleAlerts, type ModuleAlertItem } from '@/lib/module-alerts-api';
import { useTranslation } from '@/hooks/useTranslation';

const MODULE_KEY = 'gestion-academique.vie-scolaire';

function severityClass(severity: ModuleAlertItem['severity']) {
  if (severity === 'CRITICAL') return 'text-destructive';
  if (severity === 'WARNING') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

export function ComplianceAlerts() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['module-alerts', MODULE_KEY],
    queryFn: () => fetchModuleAlerts(MODULE_KEY, 12),
    refetchInterval: 60_000,
  });

  const alerts = data?.items ?? [];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            {t('account.notifications.page.landingAlertsTitle', 'Alertes & événements')}
          </CardTitle>
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
            {t('account.notifications.page.landingAlertsTitle', 'Alertes & événements')}
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium">
            {t('account.notifications.page.landingAlertsSubtitle', 'Vie scolaire · catalogue, sessions, conformité')}
          </p>
        </div>
        <Badge variant="outline" className="font-bold">
          {alerts.length}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isError ? (
            <p className="text-xs text-destructive font-medium py-4 text-center">
              {t('topbar.notifications.loadError')}
            </p>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <ModuleAlertRow key={alert.id} alert={alert} />
            ))
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="size-10 bg-success/10 rounded-full flex items-center justify-center mb-2">
                <ShieldAlert className="size-5 text-success" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                {t('account.notifications.page.landingAlertsEmpty', 'Aucun événement récent')}
              </p>
            </div>
          )}
        </div>
        <Link
          href="/account/notifications"
          className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
        >
          {t('topbar.notifications.viewAll')}
        </Link>
      </CardContent>
    </Card>
  );
}

function ModuleAlertRow({ alert }: { alert: ModuleAlertItem }) {
  const { t } = useTranslation();
  const categoryLabel = t(
    `topbar.notifications.categories.${alert.category}`,
    alert.category,
  );
  const timeLabel = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true,
    locale: fr,
  });
  const href = alert.href ?? '/account/notifications';

  return (
    <div className="group relative bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground/90 line-clamp-2">{alert.title}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2">{alert.body}</p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge variant="outline" size="xs" className="text-[9px] font-bold uppercase tracking-tighter py-0">
              {categoryLabel}
            </Badge>
            {alert.unread ? (
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            ) : null}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={cn(
              'flex items-center justify-end gap-1 text-[10px] font-bold',
              severityClass(alert.severity),
            )}
          >
            <Clock className="size-3" />
            {timeLabel}
          </div>
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
