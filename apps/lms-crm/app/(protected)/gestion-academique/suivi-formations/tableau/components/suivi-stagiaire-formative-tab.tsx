'use client';

/** WF-21 — évaluations formatives. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type Item = {
  id: string;
  label: string;
  score: number | null;
  passed: boolean | null;
  feedback: string | null;
  createdAt: string;
};

export function SuiviStagiaireFormativeTab({ participantId }: { participantId: string }) {
  const qc = useQueryClient();
  const queryKey = ['formative-assessments', participantId] as const;
  const [label, setLabel] = useState('');
  const [score, setScore] = useState('');
  const [passed, setPassed] = useState<'unset' | 'true' | 'false'>('unset');
  const [feedback, setFeedback] = useState('');

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/participants/${participantId}/formative-assessments`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Chargement impossible.');
      return unwrapSectionApiData<{ items: Item[] }>(json)!;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!label.trim()) throw new Error('Libellé requis.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/participants/${participantId}/formative-assessments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: label.trim(),
            score: score === '' ? null : Number(score),
            passed: passed === 'unset' ? null : passed === 'true',
            feedback: feedback || null,
          }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Création impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success('Évaluation enregistrée');
      setLabel('');
      setScore('');
      setPassed('unset');
      setFeedback('');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 p-6">
      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <p className="text-sm font-medium">Nouvelle évaluation formative</p>
        <div className="space-y-2">
          <Label>Libellé</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="QCM module 2…" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Score</Label>
            <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Résultat</Label>
            <Select value={passed} onValueChange={(v) => setPassed(v as typeof passed)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Non renseigné</SelectItem>
                <SelectItem value="true">Réussi</SelectItem>
                <SelectItem value="false">Échec</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Feedback</Label>
          <Textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending || !label.trim()}>
          Enregistrer
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (data?.items?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune évaluation formative.</p>
      ) : (
        <ul className="space-y-2">
          {data!.items.map((item) => (
            <li key={item.id} className="rounded-lg border border-border/60 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{item.label}</span>
                {item.passed === true ? (
                  <Badge variant="success" appearance="outline">
                    Réussi
                  </Badge>
                ) : item.passed === false ? (
                  <Badge variant="secondary" appearance="outline">
                    Échec
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.score != null ? `Score ${item.score} · ` : ''}
                {new Date(item.createdAt).toLocaleString('fr-FR')}
              </p>
              {item.feedback ? <p className="text-xs mt-1">{item.feedback}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
