'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Timer, Loader2 } from 'lucide-react';

interface Absence {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  duration: number;
}

function normalizeAbsences(payload: unknown): Absence[] {
  if (Array.isArray(payload)) return payload as Absence[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as Absence[];
    if (record.data && typeof record.data === 'object') {
      const dataRecord = record.data as Record<string, unknown>;
      if (Array.isArray(dataRecord.items)) return dataRecord.items as Absence[];
    }
    if (Array.isArray(record.items)) return record.items as Absence[];
  }
  return [];
}

export function UserAbsences({ user }: { user: any }) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        const response = await apiFetch(`/api/sections/gestion-ressources/rh/absences?userId=${user.id}`);
        if (response.ok) {
          const result = await response.json();
          setAbsences(normalizeAbsences(result));
        }
      } catch (error) {
        console.error('Error fetching absences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAbsences();
  }, [user.id]);

  const getStatusProps = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return { label: 'Approuvé', variant: 'success', icon: CheckCircle2 };
      case 'PENDING':
        return { label: 'En attente', variant: 'warning', icon: Timer };
      case 'REJECTED':
        return { label: 'Refusé', variant: 'destructive', icon: XCircle };
      default:
        return { label: status, variant: 'outline', icon: AlertCircle };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalDays = absences.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <Card className="shadow-none border border-border/60 bg-muted/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-background border border-border flex items-center justify-center">
                <Calendar className="size-5 text-primary/60" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Absences</p>
                <p className="text-xl font-bold text-foreground leading-none">{absences.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border border-border/60 bg-muted/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-lg bg-background border border-border flex items-center justify-center">
                <Clock className="size-5 text-primary/60" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Jours cumulés</p>
                <p className="text-xl font-bold text-foreground leading-none">{totalDays} jours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border border-border/60 overflow-hidden">
        <CardContent className="p-0">
          {absences.length > 0 ? (
            <div className="divide-y divide-border/50">
              {absences.map((absence) => {
                const statusProps = getStatusProps(absence.status);
                const StatusIcon = statusProps.icon;
                return (
                  <div key={absence.id} className="p-4 hover:bg-muted/5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-background border border-border mt-0.5`}>
                          <Calendar className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{absence.type}</span>
                          <span className="text-xs text-muted-foreground font-medium">
                            Du {format(new Date(absence.startDate), 'dd MMM yyyy', { locale: fr })} au {format(new Date(absence.endDate), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          {absence.reason && (
                            <span className="text-xs text-muted-foreground italic mt-1 bg-muted/30 px-2 py-1 rounded border border-border/50">
                                "{absence.reason}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={statusProps.variant as any} appearance="light" className="font-bold uppercase text-[10px] px-2 py-0.5 flex items-center gap-1 border-none">
                          <StatusIcon className="size-3" />
                          {statusProps.label}
                        </Badge>
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
                          {absence.duration} JOURS
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="size-6 text-muted-foreground/40" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Aucune absence</h4>
              <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                Aucun enregistrement d'absence n'a été trouvé pour cet utilisateur.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
