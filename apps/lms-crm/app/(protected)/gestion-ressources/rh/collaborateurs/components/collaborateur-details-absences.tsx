'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { User } from '@/app/models/user';
import { Loader2 } from 'lucide-react';

interface Absence {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  duration: number;
}

interface CollaborateurDetailsAbsencesProps {
  collaborateur: User;
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

export function CollaborateurDetailsAbsences({ collaborateur }: CollaborateurDetailsAbsencesProps) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        const response = await apiFetch(`/api/sections/gestion-ressources/rh/absences?userId=${collaborateur.id}`);
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
  }, [collaborateur.id]);

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="shadow-none border-border/60 bg-muted/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Absences</span>
            <span className="text-2xl font-bold text-foreground">{absences.length}</span>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/60 bg-muted/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Jours cumulés</span>
            <span className="text-2xl font-bold text-foreground">
              {absences.reduce((acc, curr) => acc + (curr.status === 'APPROVED' ? (Number(curr.duration) || 0) : 0), 0)}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/60 bg-muted/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">En attente</span>
            <span className="text-2xl font-bold text-amber-600">
              {absences.filter(a => a.status === 'PENDING').length}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-border/60 overflow-hidden bg-card">
        <CardHeader className="bg-muted/20 py-3 px-4 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="size-4" />
            Historique des demandes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {absences.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-card">
              <Calendar className="size-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Aucune absence enregistrée</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {absences.map((absence) => {
                const status = getStatusProps(absence.status);
                return (
                  <div key={absence.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors bg-card">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        absence.status === 'APPROVED' ? 'bg-success/10 text-success' : 
                        absence.status === 'PENDING' ? 'bg-warning/10 text-warning' : 
                        'bg-destructive/10 text-destructive'
                      }`}>
                        <status.icon className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground uppercase text-xs tracking-wide">{absence.type}</span>
                          <Badge variant={status.variant as any} appearance="light" size="sm" className="text-[10px] font-bold uppercase">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="size-3" />
                            {format(new Date(absence.startDate), 'dd MMM yyyy', { locale: fr })} - {format(new Date(absence.endDate), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-muted-foreground">
                            <Timer className="size-3" />
                            {absence.duration} jours
                          </span>
                        </div>
                      </div>
                    </div>
                    {absence.reason && (
                      <div className="hidden md:block max-w-[200px] text-right">
                        <p className="text-[11px] text-muted-foreground italic truncate">"{absence.reason}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
