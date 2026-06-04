'use client';
import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { AlertCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Alert {
  id: string;
  userId: string;
  userName: string;
  type: string;
  itemType: string;
  expiryDate: string;
  severity: 'CRITICAL' | 'WARNING';
}

function normalizeAlerts(payload: unknown): Alert[] {
  if (Array.isArray(payload)) {
    return payload as Alert[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as Alert[];
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items as Alert[];
    }
    if (Array.isArray(record.items)) return record.items as Alert[];
  }
  return [];
}

export function ComplianceAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await apiFetch('/api/sections/gestion-ressources/rh/compliance/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(normalizeAlerts(data));
        }
      } catch (error) {
        console.error("Erreur chargement alertes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

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
            Alertes Critiques
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium">Echeances a 30 jours</p>
        </div>
        <Badge variant="outline" className="font-bold">{alerts.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? alerts.map((alert) => (
            <div key={alert.id} className="group relative bg-background border border-border rounded-lg p-3 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground/90 uppercase truncate max-w-[150px]">
                    {alert.userName}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" size="xs" className="text-[9px] font-bold uppercase tracking-tighter py-0">
                      {alert.itemType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${
                    alert.severity === 'CRITICAL' ? 'text-destructive' : 'text-warning'
                  }`}>
                    <Clock className="size-3" />
                    {formatDistanceToNow(new Date(alert.expiryDate), { addSuffix: true, locale: fr })}
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium">
                    le {new Date(alert.expiryDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              
              <Link 
                href="/administration-facturation/finance/factures"
                className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-primary/5 flex items-center justify-center transition-opacity rounded-lg"
              >
                <ArrowRight className="size-4 text-primary" />
              </Link>
            </div>
          )) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="size-10 bg-success/10 rounded-full flex items-center justify-center mb-2">
                <ShieldAlert className="size-5 text-success" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Aucune alerte critique</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
