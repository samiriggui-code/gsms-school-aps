'use client';

/**
 * WF-02/03/04 — assessments candidature + cycle adaptation (fiche candidat).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';

type AssessmentItem = {
  id: string;
  kind: 'NEEDS_ANALYSIS' | 'POSITIONING';
  status: string;
  sentAt: string | null;
  completedAt: string | null;
  adaptationRequired: boolean | null;
  adaptationStatus: string | null;
  level: string | null;
  prerequisitesStatus: string | null;
};

const KIND_LABEL: Record<string, string> = {
  NEEDS_ANALYSIS: 'Analyse du besoin',
  POSITIONING: 'Positionnement',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  SENT: 'Envoyé',
  COMPLETED: 'Complété',
};

const ADAPT_LABEL: Record<string, string> = {
  NO_ADAPTATION_REQUIRED: 'Pas d’aménagement',
  ADAPTATION_PENDING: 'En attente',
  ADAPTATION_APPROVED: 'Approuvé',
  ADAPTATION_IMPLEMENTED: 'Mis en œuvre',
};

const ADAPT_NEXT: Record<string, string | null> = {
  ADAPTATION_PENDING: 'ADAPTATION_APPROVED',
  ADAPTATION_APPROVED: 'ADAPTATION_IMPLEMENTED',
  ADAPTATION_IMPLEMENTED: null,
  NO_ADAPTATION_REQUIRED: null,
};

export function CandidatureAssessmentsSection({ candidatureId }: { candidatureId: string }) {
  const qc = useQueryClient();
  const queryKey = ['candidature-assessments', candidatureId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/candidatures/${candidatureId}/assessments`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Impossible de charger les questionnaires.');
      return unwrapSectionApiData<{
        items: AssessmentItem[];
        adaptationRequired: boolean;
        adaptationPending: boolean;
      }>(json)!;
    },
    enabled: Boolean(candidatureId),
  });

  const relance = useMutation({
    mutationFn: async (assessmentId?: string) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/candidatures/${candidatureId}/assessments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessmentId ? { assessmentId } : {}),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Échec');
      return json;
    },
    onSuccess: () => {
      toast.success('Questionnaire (re)envoyé');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adapt = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/candidatures/${candidatureId}/assessments/${id}/adaptation`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adaptationStatus: next }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Échec');
      return json;
    },
    onSuccess: () => {
      toast.success('Adaptation mise à jour');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const needs = items.find((i) => i.kind === 'NEEDS_ANALYSIS');

  return (
    <Card className="shadow-none border border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Analyse du besoin / Positionnement
        </CardTitle>
        <CardDescription className="text-xs">
          Questionnaires WF-02/03 et suivi accessibilité (WF-04).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Chargement…
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">Aucun questionnaire démarré.</p>
            <Button size="sm" variant="outline" onClick={() => relance.mutate(undefined)} disabled={relance.isPending}>
              Lancer l’analyse du besoin
            </Button>
          </div>
        ) : (
          items.map((item) => {
            const nextAdapt = item.adaptationStatus ? ADAPT_NEXT[item.adaptationStatus] : null;
            return (
              <div key={item.id} className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{KIND_LABEL[item.kind] ?? item.kind}</span>
                    <Badge variant="secondary" appearance="outline">
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Badge>
                    {item.adaptationStatus ? (
                      <Badge
                        variant={item.adaptationStatus === 'ADAPTATION_PENDING' ? 'warning' : 'secondary'}
                        appearance="outline"
                      >
                        {ADAPT_LABEL[item.adaptationStatus] ?? item.adaptationStatus}
                      </Badge>
                    ) : null}
                  </div>
                  {item.status !== 'COMPLETED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => relance.mutate(item.id)}
                      disabled={relance.isPending}
                    >
                      <RefreshCw className="size-3.5 me-1" />
                      Relancer
                    </Button>
                  ) : null}
                </div>
                {item.kind === 'POSITIONING' && item.status === 'COMPLETED' ? (
                  <p className="text-xs text-muted-foreground">
                    Niveau : {item.level ?? '—'} · Prérequis : {item.prerequisitesStatus ?? '—'}
                  </p>
                ) : null}
                {item.kind === 'NEEDS_ANALYSIS' && nextAdapt ? (
                  <Button
                    size="sm"
                    onClick={() => adapt.mutate({ id: item.id, next: nextAdapt })}
                    disabled={adapt.isPending}
                  >
                    Passer à {ADAPT_LABEL[nextAdapt] ?? nextAdapt}
                  </Button>
                ) : null}
              </div>
            );
          })
        )}
        {needs?.adaptationRequired === true && !needs.adaptationStatus ? (
          <p className="text-xs text-amber-700">Besoin d’adaptation déclaré (statut en cours de synchro).</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
