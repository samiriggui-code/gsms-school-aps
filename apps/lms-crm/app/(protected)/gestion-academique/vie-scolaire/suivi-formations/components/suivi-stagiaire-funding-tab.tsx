'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
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
import { SUIVI_FUNDING_MODE_OPTIONS } from '@/lib/suivi-formations/funding-modes';
import type { SuiviFundingPayload, SuiviStagiaireRow } from '../types/suivi-formations-api';

export function SuiviStagiaireFundingTab({
  sessionId,
  participantId,
  initialFunding,
}: {
  sessionId: string | null;
  participantId: string;
  initialFunding: Pick<
    SuiviStagiaireRow,
    'fundingMode' | 'fundingReference' | 'fundingNotes' | 'fundingModeLabel' | 'fundingSource'
  >;
}) {
  const queryClient = useQueryClient();
  const [fundingMode, setFundingMode] = useState(initialFunding.fundingMode ?? '');
  const [fundingReference, setFundingReference] = useState(initialFunding.fundingReference ?? '');
  const [fundingNotes, setFundingNotes] = useState(initialFunding.fundingNotes ?? '');

  useEffect(() => {
    setFundingMode(initialFunding.fundingMode ?? '');
    setFundingReference(initialFunding.fundingReference ?? '');
    setFundingNotes(initialFunding.fundingNotes ?? '');
  }, [initialFunding]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('Session requise.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/participants/${participantId}/funding`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fundingMode: fundingMode || null,
            fundingReference: fundingReference || null,
            fundingNotes: fundingNotes || null,
          }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Enregistrement impossible.');
      }
      return (await res.json()).data as SuiviFundingPayload;
    },
    onSuccess: () => {
      toast.success('Financeur enregistré.');
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'participants'],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 p-6">
      {initialFunding.fundingSource === 'candidature' ? (
        <Badge variant="secondary" appearance="outline">
          Valeur héritée du dossier candidature — enregistrer pour figer sur la session
        </Badge>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Mode de financement</Label>
          <Select
            value={fundingMode || 'unset'}
            onValueChange={(v) => setFundingMode(v === 'unset' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un financeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Non renseigné</SelectItem>
              {SUIVI_FUNDING_MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Référence dossier</Label>
          <Input
            value={fundingReference}
            onChange={(e) => setFundingReference(e.target.value)}
            placeholder="N° dossier CPF, AIF, OPCO…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Notes financeur</Label>
          <Textarea
            value={fundingNotes}
            onChange={(e) => setFundingNotes(e.target.value)}
            rows={3}
            placeholder="Précisions pour les exports conformité…"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        className="gap-2"
        disabled={saveMutation.isPending || !sessionId}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Enregistrer le financeur
      </Button>
    </div>
  );
}
