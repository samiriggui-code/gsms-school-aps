'use client';

/** WF-17/18 — présence, alertes signature, justification d’absence. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/helpers';
import {
  SUIVI_DAY_SLOT_LABELS,
  SUIVI_EMARGEMENT_STATUS_LABELS,
  type SuiviPresenceHistoryRow,
} from '../types/suivi-formations-api';

const JUSTIF_LABEL: Record<string, string> = {
  UNJUSTIFIED: 'Non justifiée',
  JUSTIFICATION_REQUESTED: 'Demandée',
  JUSTIFIED: 'Justifiée',
  RESOLVED: 'Résolue',
};

const JUSTIF_NEXT: Record<string, string | null> = {
  UNJUSTIFIED: 'JUSTIFICATION_REQUESTED',
  JUSTIFICATION_REQUESTED: 'JUSTIFIED',
  JUSTIFIED: 'RESOLVED',
  RESOLVED: null,
};

function formatPresenceDay(iso: string) {
  try {
    return format(parseISO(iso), 'EEE d MMM yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

export function SuiviStagiairePedagogyTab({
  sessionId,
  participantId,
}: {
  sessionId: string | null;
  participantId: string;
}) {
  const qc = useQueryClient();
  const queryKey = [
    'gestion-academique',
    'vie-scolaire',
    'suivi-formations',
    'presence',
    sessionId,
    participantId,
  ] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<SuiviPresenceHistoryRow[]> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/participants/${participantId}/presence`,
      );
      if (!res.ok) throw new Error('Historique présence indisponible.');
      const j = await res.json();
      return (j?.data?.items ?? []) as SuiviPresenceHistoryRow[];
    },
    enabled: Boolean(sessionId && participantId),
  });

  const patchJustif = useMutation({
    mutationFn: async (input: {
      dayId: string;
      emargementId: string;
      justificationStatus: string;
    }) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/days/${input.dayId}/emargement/${input.emargementId}/justification`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ justificationStatus: input.justificationStatus }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Mise à jour impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success('Justification mise à jour');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>;
  }

  const items = data ?? [];
  const unsigned = items.filter((r) => !r.markedAt);
  const openAbsences = items.filter(
    (r) =>
      r.status === 'ABSENT' &&
      (r.justificationStatus === 'UNJUSTIFIED' ||
        r.justificationStatus === 'JUSTIFICATION_REQUESTED'),
  );

  return (
    <div className="space-y-4 p-6">
      <Alert appearance="outline" variant="secondary" className="border-border bg-muted/20">
        <AlertIcon>
          <AlertTriangle className="size-4" />
        </AlertIcon>
        <AlertTitle className="text-xs font-semibold">Signature manquante (WF-17)</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Aucun bouton ne crée d’émargement à la place du stagiaire. Les alertes du soir notifient
          apprenant / formateur / admin. Lignes sans horodatage : {unsigned.length}.
        </AlertDescription>
      </Alert>

      {openAbsences.length > 0 ? (
        <Alert appearance="outline" variant="warning">
          <AlertIcon>
            <AlertTriangle className="size-4" />
          </AlertIcon>
          <AlertTitle className="text-xs font-semibold">Absences à justifier (WF-18)</AlertTitle>
          <AlertDescription className="text-xs">
            {openAbsences.length} absence(s) encore ouverte(s).
          </AlertDescription>
        </Alert>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Aucun émargement enregistré pour ce stagiaire.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Jour</th>
                <th className="px-4 py-2 text-left font-medium">Créneau</th>
                <th className="px-4 py-2 text-left font-medium">Statut</th>
                <th className="px-4 py-2 text-left font-medium">Justification</th>
                <th className="px-4 py-2 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const next = row.justificationStatus
                  ? JUSTIF_NEXT[row.justificationStatus]
                  : null;
                return (
                  <tr key={row.emargementId} className="border-t border-border/50">
                    <td className="px-4 py-3 capitalize">{formatPresenceDay(row.dayDate)}</td>
                    <td className="px-4 py-3">{SUIVI_DAY_SLOT_LABELS[row.slot]}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" appearance="outline">
                        {SUIVI_EMARGEMENT_STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                      {!row.markedAt ? (
                        <span className="ms-2 text-xs text-amber-700">sans signature</span>
                      ) : (
                        <span className="ms-2 text-xs text-muted-foreground">
                          {formatDateTime(row.markedAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'ABSENT' && row.justificationStatus ? (
                        <Badge variant="outline">
                          {JUSTIF_LABEL[row.justificationStatus] ?? row.justificationStatus}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'ABSENT' && next ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={patchJustif.isPending}
                          onClick={() =>
                            patchJustif.mutate({
                              dayId: row.dayId,
                              emargementId: row.emargementId,
                              justificationStatus: next,
                            })
                          }
                        >
                          → {JUSTIF_LABEL[next] ?? next}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
