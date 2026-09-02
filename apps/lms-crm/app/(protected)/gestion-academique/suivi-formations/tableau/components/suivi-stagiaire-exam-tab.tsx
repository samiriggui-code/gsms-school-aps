'use client';

/** WF-24 — examen + proposition de rattrapage. */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { SUIVI_EXAM_OUTCOME_LABELS, type SuiviStagiaireRow } from '../types/suivi-formations-api';

export function SuiviStagiaireExamTab({
  participantId,
  stagiaire,
}: {
  participantId: string;
  stagiaire: SuiviStagiaireRow;
}) {
  const qc = useQueryClient();
  const [retakeDate, setRetakeDate] = useState(
    stagiaire.retakeDate ? stagiaire.retakeDate.slice(0, 10) : '',
  );
  const [notes, setNotes] = useState(stagiaire.retakeNotes ?? '');

  const propose = useMutation({
    mutationFn: async () => {
      if (!retakeDate) throw new Error('Date de rattrapage requise.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/examens/${participantId}/retake`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            retakeDate: `${retakeDate}T12:00:00.000Z`,
            notes: notes || undefined,
          }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Proposition impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success('Rattrapage proposé');
      qc.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'participants'],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canPropose = stagiaire.examOutcome === 'FAILED';

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Résultat examen</span>
        <Badge
          variant={stagiaire.examOutcome === 'PASSED' ? 'success' : 'secondary'}
          appearance="outline"
        >
          {SUIVI_EXAM_OUTCOME_LABELS[stagiaire.examOutcome] ?? stagiaire.examOutcome}
        </Badge>
      </div>

      {stagiaire.retakeDate ? (
        <p className="text-sm text-muted-foreground">
          Rattrapage proposé le{' '}
          <span className="text-foreground font-medium">
            {new Date(stagiaire.retakeDate).toLocaleDateString('fr-FR')}
          </span>
          {stagiaire.retakeNotes ? ` — ${stagiaire.retakeNotes}` : null}
        </p>
      ) : null}

      {canPropose ? (
        <div className="space-y-3 rounded-lg border border-border/60 p-4">
          <p className="text-sm font-medium">Proposer un rattrapage (WF-24)</p>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={retakeDate} onChange={(e) => setRetakeDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={() => propose.mutate()} disabled={propose.isPending || !retakeDate}>
            Envoyer la proposition
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          La proposition de rattrapage n’est disponible qu’après un résultat « Échec ». Le nouveau
          résultat se saisit via le panneau examens existant.
        </p>
      )}
    </div>
  );
}
