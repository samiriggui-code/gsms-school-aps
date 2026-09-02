'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDateTime } from '@/lib/helpers';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Sparkles, Check, X, Upload } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

type SlotPayload = {
  title: string;
  objectives: string[];
  activities: string[];
};

type DayPayload = {
  dayIndex: number;
  dateLabel: string;
  morning: SlotPayload | null;
  evening: SlotPayload | null;
};

type ArtifactRow = {
  id: string;
  status: 'PROPOSED' | 'APPROVED' | 'APPLIED' | 'REJECTED';
  payload: { days?: DayPayload[] };
  createdAt: string;
  reviewedAt: string | null;
  appliedAt: string | null;
  reviewedBy: { id: string; name: string | null } | null;
  run: { model: string; createdAt: string };
};

type ActiveRunRow = {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
  errorMessage: string | null;
};

type ArtifactsResponse = {
  artifacts: ArtifactRow[];
  activeRuns: ActiveRunRow[];
};

const STATUS_LABEL: Record<ArtifactRow['status'], string> = {
  PROPOSED: 'Proposé',
  APPROVED: 'Approuvé',
  APPLIED: 'Appliqué',
  REJECTED: 'Rejeté',
};

function artifactsQueryKey(sessionId: string) {
  return ['session-ai-pedagogical-outline', sessionId] as const;
}

function apiBase(sessionId: string) {
  return `/api/sections/gestion-academique/vie-scolaire/sessions/${encodeURIComponent(sessionId)}/ai/pedagogical-outline`;
}

/** GSMS-AI-03 — brouillon déroulé session : draft → review → apply. */
export function SessionPedagogicalOutlineAiPanel({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();

  const artifactsQuery = useQuery({
    queryKey: artifactsQueryKey(sessionId),
    queryFn: async () => {
      const res = await apiFetch(`${apiBase(sessionId)}/artifacts`);
      if (!res.ok) throw new Error('fetch');
      const data = unwrapSectionApiData<ArtifactsResponse>(await res.json());
      return {
        artifacts: data?.artifacts ?? [],
        activeRuns: data?.activeRuns ?? [],
      };
    },
    staleTime: 15_000,
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const runs = query.state.data?.activeRuns ?? [];
      return runs.some((r) => r.status === 'PENDING' || r.status === 'RUNNING') ? 3000 : false;
    },
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: artifactsQueryKey(sessionId) });
  };

  const draftMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`${apiBase(sessionId)}/draft`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof (json as { error?: { message?: string } }).error === 'object'
            ? ((json as { error: { message?: string } }).error.message ?? 'Génération impossible')
            : 'Génération impossible',
        );
      }
      return unwrapSectionApiData<{ runId: string; status: string }>(json);
    },
    onSuccess: () => {
      toast.success('Génération lancée — le brouillon apparaîtra dans quelques instants.');
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ artifactId, approve }: { artifactId: string; approve: boolean }) => {
      const res = await apiFetch(`${apiBase(sessionId)}/artifacts/${artifactId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error('Revue impossible');
      }
      return json;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.approve ? 'Brouillon approuvé' : 'Brouillon rejeté');
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const applyMutation = useMutation({
    mutationFn: async (artifactId: string) => {
      const res = await apiFetch(`${apiBase(sessionId)}/artifacts/${artifactId}/apply`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof (json as { error?: { message?: string } }).error === 'object'
            ? ((json as { error: { message?: string } }).error.message ?? 'Application impossible')
            : 'Application impossible',
        );
      }
      return json;
    },
    onSuccess: () => {
      toast.success('Déroulé appliqué sur la session.');
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = draftMutation.isPending || reviewMutation.isPending || applyMutation.isPending;
  const artifacts = artifactsQuery.data?.artifacts ?? [];
  const activeRuns = artifactsQuery.data?.activeRuns ?? [];
  const generating = activeRuns.some((r) => r.status === 'PENDING' || r.status === 'RUNNING');

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5 shadow-none">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <CardTitle className="text-sm font-semibold">Déroulé pédagogique (IA)</CardTitle>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || generating}
          onClick={() => draftMutation.mutate()}
        >
          {draftMutation.isPending || generating ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-3.5" aria-hidden />
          )}
          {generating ? 'Génération…' : 'Générer brouillon'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Proposition jour / créneau à partir du programme formation — aucune écriture automatique.
          Approuvez puis appliquez pour stocker le déroulé sur la session.
        </p>

        {generating ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Génération IA en cours (worker)…
          </div>
        ) : null}

        {artifactsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Chargement des brouillons…
          </div>
        ) : null}

        {!artifactsQuery.isLoading && artifacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun brouillon pour cette session.</p>
        ) : null}

        {artifacts.map((artifact) => {
          const days = artifact.payload?.days ?? [];
          return (
            <div
              key={artifact.id}
              className="space-y-2 rounded-lg border border-border/70 bg-background/80 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" appearance="outline" size="sm">
                    {STATUS_LABEL[artifact.status]}
                  </Badge>
                  <span>{formatDateTime(artifact.createdAt)}</span>
                  <span>· {artifact.run.model}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {artifact.status === 'PROPOSED' ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={pending}
                        onClick={() =>
                          reviewMutation.mutate({ artifactId: artifact.id, approve: true })
                        }
                      >
                        <Check className="size-3.5" aria-hidden />
                        Approuver
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          reviewMutation.mutate({ artifactId: artifact.id, approve: false })
                        }
                      >
                        <X className="size-3.5" aria-hidden />
                        Rejeter
                      </Button>
                    </>
                  ) : null}
                  {artifact.status === 'APPROVED' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={pending}
                      onClick={() => applyMutation.mutate(artifact.id)}
                    >
                      {applyMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Upload className="size-3.5" aria-hidden />
                      )}
                      Appliquer
                    </Button>
                  ) : null}
                </div>
              </div>
              <ul className="space-y-1.5 text-xs">
                {days.slice(0, 5).map((day) => (
                  <li key={`${artifact.id}-${day.dayIndex}`} className="text-muted-foreground">
                    <span className="font-medium text-foreground">{day.dateLabel}</span>
                    {day.morning ? ` · Matin : ${day.morning.title}` : ''}
                    {day.evening ? ` · Soir : ${day.evening.title}` : ''}
                  </li>
                ))}
                {days.length > 5 ? (
                  <li className="text-muted-foreground">… +{days.length - 5} jour(s)</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
