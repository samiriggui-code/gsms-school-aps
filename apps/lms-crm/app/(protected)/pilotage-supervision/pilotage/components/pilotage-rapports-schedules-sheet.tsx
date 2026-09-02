'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Switch } from '@repo/ui/switch';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { formatDateTime } from '@/lib/helpers';
import {
  fetchPilotageReportSchedules,
  runPilotageReportScheduleNow,
  updatePilotageReportSchedule,
} from '@/lib/pilotage/api';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PilotageRapportsSchedulesSheet({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['pilotage-report-schedules'],
    queryFn: fetchPilotageReportSchedules,
    enabled: open,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updatePilotageReportSchedule(id, enabled),
    onSuccess: (_data, { enabled }) => {
      toast.success(enabled ? 'Planification activée' : 'Planification désactivée');
      queryClient.invalidateQueries({ queryKey: ['pilotage-report-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['pilotage-rapports'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Mise à jour impossible'),
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => runPilotageReportScheduleNow(id),
    onSuccess: (result) => {
      if (result.skipped) {
        toast.info(result.message ?? 'Rapport déjà disponible pour cette période.');
      } else {
        toast.success('Génération lancée — le rapport apparaîtra dans l\'historique sous peu.');
      }
      queryClient.invalidateQueries({ queryKey: ['pilotage-report-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['pilotage-rapports'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Lancement impossible'),
  });

  const schedules = data?.schedules ?? [];
  const busyId = runMutation.isPending ? runMutation.variables : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-primary" />
            Rapports automatiques
          </SheetTitle>
          <SheetDescription className="text-start text-xs leading-relaxed">
            Le toggle active la génération récurrente (jour / semaine / mois / trimestre). Un rapport identique non
            modifié n&apos;est pas recréé pour la même fenêtre — garde-fou anti-saturation. « Lancer
            maintenant » force une tentative immédiate (sous réserve du garde-fou).
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex-1 overflow-y-auto p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Chargement des planifications…
            </div>
          ) : schedules.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Aucune planification configurée.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {schedules.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <Badge variant="outline" appearance="light" className="text-[10px] uppercase">
                        {s.frequencyLabel}
                      </Badge>
                      <Badge variant="secondary" appearance="light" className="text-[10px] uppercase">
                        {s.format}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {s.summary ?? s.templateLabel}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {s.lastRunAt ? (
                        <>Dernière exécution : {formatDateTime(s.lastRunAt)}</>
                      ) : (
                        <>Jamais exécuté</>
                      )}
                      {s.nextRunAt && s.enabled ? (
                        <span className="ms-2">· Prochaine auto : {formatDateTime(s.nextRunAt)}</span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={busyId === s.id || toggleMutation.isPending}
                      onClick={() => runMutation.mutate(s.id)}
                    >
                      {busyId === s.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-4" />
                      )}
                      Lancer maintenant
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Planif. auto</span>
                      <Switch
                        checked={s.enabled}
                        disabled={toggleMutation.isPending || busyId === s.id}
                        onCheckedChange={(enabled) => toggleMutation.mutate({ id: s.id, enabled })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
