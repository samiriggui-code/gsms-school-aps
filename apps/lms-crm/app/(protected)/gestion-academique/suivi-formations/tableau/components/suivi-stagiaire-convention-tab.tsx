'use client';

/** WF-08 — statut convention (lecture + avance SIGNED/ARCHIVED si besoin). */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Skeleton } from '@repo/ui/skeleton';

const STATUS_LABEL: Record<string, string> = {
  GENERATED: 'Générée',
  SENT: 'Envoyée',
  VIEWED: 'Consultée',
  SIGNED: 'Signée',
  ARCHIVED: 'Archivée',
};

const NEXT: Record<string, string | null> = {
  GENERATED: 'SENT',
  SENT: 'VIEWED',
  VIEWED: 'SIGNED',
  SIGNED: 'ARCHIVED',
  ARCHIVED: null,
};

export function SuiviStagiaireConventionTab({
  sessionId,
  participantId,
}: {
  sessionId: string | null;
  participantId: string;
}) {
  const qc = useQueryClient();
  const queryKey = ['participant-convention', sessionId, participantId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/participants/${participantId}/convention`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Chargement convention impossible.');
      return unwrapSectionApiData<{
        convention: {
          id: string;
          status: string;
          sentAt: string | null;
          signedAt: string | null;
        } | null;
      }>(json)!;
    },
    enabled: Boolean(sessionId && participantId),
  });

  const advance = useMutation({
    mutationFn: async (status: string) => {
      const id = data?.convention?.id;
      if (!id || !sessionId) throw new Error('Convention introuvable.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/${sessionId}/conventions/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Mise à jour impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success('Convention mise à jour');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-16 w-full" /></div>;

  const c = data?.convention;
  if (!c) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Aucune convention enregistrée pour ce participant. Génération via les documents de session.
      </div>
    );
  }

  const next = NEXT[c.status] ?? null;

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Statut</span>
        <Badge variant="secondary" appearance="outline">
          {STATUS_LABEL[c.status] ?? c.status}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Envoyée : {c.sentAt ? new Date(c.sentAt).toLocaleString('fr-FR') : '—'} · Signée :{' '}
        {c.signedAt ? new Date(c.signedAt).toLocaleString('fr-FR') : '—'}
      </p>
      {next ? (
        <Button size="sm" variant="outline" disabled={advance.isPending} onClick={() => advance.mutate(next)}>
          Passer à {STATUS_LABEL[next] ?? next}
        </Button>
      ) : null}
    </div>
  );
}
