'use client';

/** WF-19 — risque de rupture. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import type { SuiviStagiaireRow } from '../types/suivi-formations-api';

const STATUS_LABEL: Record<string, string> = {
  NONE: 'Aucun',
  FLAGGED: 'Signalé',
  CONTACTED: 'Contacté',
  ACTION_PROPOSED: 'Action proposée',
  RESOLVED: 'Résolu',
};

const NEXT: Record<string, string | null> = {
  FLAGGED: 'CONTACTED',
  CONTACTED: 'ACTION_PROPOSED',
  ACTION_PROPOSED: 'RESOLVED',
  NONE: null,
  RESOLVED: null,
};

export function SuiviStagiaireDropoutTab({
  participantId,
  stagiaire,
}: {
  participantId: string;
  stagiaire: SuiviStagiaireRow;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(stagiaire.dropoutRiskNotes ?? '');
  const next = NEXT[stagiaire.dropoutRiskStatus] ?? null;

  const advance = useMutation({
    mutationFn: async (dropoutRiskStatus: string) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/participants/${participantId}/dropout-risk`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dropoutRiskStatus, notes: notes || undefined }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Transition impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success('Suivi rupture mis à jour');
      qc.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'participants'],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Statut</span>
        <Badge
          variant={stagiaire.dropoutRiskStatus === 'FLAGGED' ? 'warning' : 'secondary'}
          appearance="outline"
        >
          {STATUS_LABEL[stagiaire.dropoutRiskStatus] ?? stagiaire.dropoutRiskStatus}
        </Badge>
      </div>
      {stagiaire.dropoutRiskReason ? (
        <p className="text-sm text-muted-foreground">
          Motif : <span className="text-foreground">{stagiaire.dropoutRiskReason}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun signal de rupture pour l’instant.</p>
      )}
      {stagiaire.dropoutRiskFlaggedAt ? (
        <p className="text-xs text-muted-foreground">
          Flaggué le {new Date(stagiaire.dropoutRiskFlaggedAt).toLocaleString('fr-FR')}
        </p>
      ) : null}

      {next ? (
        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <div className="space-y-2">
            <Label>Notes staff</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={() => advance.mutate(next)} disabled={advance.isPending}>
            Passer à {STATUS_LABEL[next] ?? next}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
