'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type Metrics = {
  agentsCount?: number;
  sitesCount?: number;
  hoursThisMonth?: number;
  complianceAlerts?: number;
};

type StatItem = {
  value: string;
  label: string;
  badge: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'secondary' | 'destructive';
  note: string;
};

export function Statistics1({ metrics }: { metrics?: Metrics }) {
  const formatCount = (value?: number) =>
    new Intl.NumberFormat('fr-FR').format(value ?? 0);

  const formatHours = (value?: number) =>
    `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value ?? 0)} h`;

  const complianceAlerts = metrics?.complianceAlerts ?? 0;

  const items: StatItem[] = [
    {
      value: formatCount(metrics?.agentsCount),
      label: 'Agents actifs',
      badge: 'Actifs',
      badgeVariant: 'info',
      note: 'Ressources assignées',
    },
    {
      value: formatCount(metrics?.sitesCount),
      label: 'Sites couverts',
      badge: 'Mois',
      badgeVariant: 'secondary',
      note: 'Présences agents',
    },
    {
      value: formatHours(metrics?.hoursThisMonth),
      label: 'Heures cumulées',
      badge: 'Mois',
      badgeVariant: 'secondary',
      note: 'Temps opérationnel',
    },
    {
      value: formatCount(complianceAlerts),
      label: 'Alertes conformité',
      badge: complianceAlerts > 0 ? 'Alerte' : 'OK',
      badgeVariant: complianceAlerts > 0 ? 'destructive' : 'success',
      note: 'Carte pro non conforme',
    },
  ];

  return (
    <Card className="rounded-xl border border-border/60 bg-muted/20 p-1 shadow-none">
      <CardContent className="rounded-xl p-0 bg-background border border-border/60">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 px-5 py-4">
              <div className="text-2xl font-semibold text-foreground tracking-tight">
                {item.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {item.label}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant={item.badgeVariant}
                  appearance="light"
                  className="text-[10px] font-semibold px-2 py-0.5"
                >
                  {item.badge}
                </Badge>
                <span className="text-xs text-muted-foreground">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
