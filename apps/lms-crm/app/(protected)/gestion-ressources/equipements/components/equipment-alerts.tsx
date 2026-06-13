'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock3, ShieldAlert } from 'lucide-react';
import { useEquipmentDashboardStats } from '@/lib/hooks/gestion-ressources/equipements/use-dashboard-stats';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';

export function EquipmentAlerts() {
  const { data, isLoading } = useEquipmentDashboardStats();
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

  if (isLoading) {
    return (
      <Card className={MODULE_LANDING_ALERTS_CARD_CLASS}>
        <CardHeader className="pb-3 border-b border-dashed">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Alertes de Conformité</CardTitle>
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
          <p className="text-xs text-muted-foreground font-medium">État du parc en temps réel</p>
        </div>
        <Badge variant="outline" className="font-bold">{totalAlerts}</Badge>
      </CardHeader>
      <CardContent>
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
              <Clock3 className="size-3.5 text-blue-500" />
              En service
            </div>
            <Badge variant="secondary" appearance="light">{inUse}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
