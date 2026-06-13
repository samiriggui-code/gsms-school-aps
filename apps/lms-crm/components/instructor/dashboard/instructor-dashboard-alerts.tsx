'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight, CalendarClock, Clock, ShieldAlert } from 'lucide-react';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InstructorDashboardAlert } from '@/lib/instructor/instructor-types';
import { cn } from '@/lib/utils';

type InstructorDashboardAlertsProps = {
  alerts: InstructorDashboardAlert[];
};

function severityClass(severity: InstructorDashboardAlert['severity']) {
  if (severity === 'CRITICAL') return 'text-destructive';
  if (severity === 'WARNING') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

const KIND_LABEL: Record<InstructorDashboardAlert['kind'], string> = {
  session: 'Session',
  trainee: 'Stagiaire',
  announcement: 'Annonce',
  notification: 'Notification',
};

export function InstructorDashboardAlerts({ alerts }: InstructorDashboardAlertsProps) {
  return (
    <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <ShieldAlert className="size-4 text-destructive" />
            Alertes & rappels
          </CardTitle>
          <p className="text-xs font-medium text-muted-foreground">
            Sessions à venir, progression stagiaires, notifications
          </p>
        </div>
        <Badge variant="outline" className="font-bold">
          {alerts.length}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => <InstructorAlertRow key={alert.id} alert={alert} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-success/10">
                <CalendarClock className="size-5 text-success" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                Aucune alerte pour le moment
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Vos sessions et stagiaires sont à jour.
              </p>
            </div>
          )}
        </div>
        <Link
          href="/formateur/notifications"
          className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
        >
          Centre de notifications →
        </Link>
      </CardContent>
    </Card>
  );
}

function InstructorAlertRow({ alert }: { alert: InstructorDashboardAlert }) {
  const timeLabel = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="group relative rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 text-xs font-bold text-foreground/90">{alert.title}</p>
          <p className="line-clamp-2 text-[10px] text-muted-foreground">{alert.body}</p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge
              variant="outline"
              size="xs"
              className="py-0 text-[9px] font-bold uppercase tracking-tighter"
            >
              {KIND_LABEL[alert.kind]}
            </Badge>
            {alert.unread ? (
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
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
        href={alert.href}
        className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={alert.title}
      >
        <ArrowRight className="size-4 text-primary" />
      </Link>
    </div>
  );
}
