'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDateTime } from '@/lib/helpers';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Sparkles, Check, X, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formationDetailQueryKey,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/hooks/use-formation-detail-query';
import { formationsCatalogQueryRoot } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/hooks/use-formations-catalog-query';

type ProgramModulePayload = {
  id: string;
  title: string;
  details: string[];
};

type ArtifactRow = {
  id: string;
  status: 'PROPOSED' | 'APPROVED' | 'APPLIED' | 'REJECTED';
  payload: { modules?: ProgramModulePayload[] };
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

function artifactsQueryKey(slug: string) {
  return ['formation-ai-program-modules', slug] as const;
}

function apiBase(slug: string) {
  return `/api/sections/gestion-academique/vie-scolaire/formations/${encodeURIComponent(slug)}/ai/program-modules`;
}

/** GSMS-AI-02 — brouillon programme : draft → review → apply (jamais d'écriture auto). */
export function FormationProgramModulesAiPanel({ formationSlug }: { formationSlug: string }) {
  const queryClient = useQueryClient();

  const artifactsQuery = useQuery({
    queryKey: artifactsQueryKey(formationSlug),
    queryFn: async () => {
      const res = await apiFetch(`${apiBase(formationSlug)}/artifacts`);
      if (!res.ok) throw new Error('fetch');
      const data = unwrapSectionApiData<ArtifactsResponse>(await res.json());
      return {
        artifacts: data?.artifacts ?? [],
        activeRuns: data?.activeRuns ?? [],
      };
    },
    staleTime: 15_000,
    refetchInterval: (query) => {
      const runs = query.state.data?.activeRuns ?? [];
      return runs.some((r) => r.status === 'PENDING' || r.status === 'RUNNING') ? 3000 : false;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: artifactsQueryKey(formationSlug) });
    queryClient.invalidateQueries({ queryKey: formationDetailQueryKey(formationSlug) });
    queryClient.invalidateQueries({ queryKey: formationsCatalogQueryRoot });
  };

  const draftMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`${apiBase(formationSlug)}/draft`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? 'Génération impossible');
      }
      return unwrapSectionApiData<{ artifactId: string }>(json);
    },
    onSuccess: () => {
      toast.success('Génération en file — le brouillon apparaîtra sous peu.');
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ artifactId, approve }: { artifactId: string; approve: boolean }) => {
      const res = await apiFetch(`${apiBase(formationSlug)}/artifacts/${artifactId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? 'Revue impossible');
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
      const res = await apiFetch(`${apiBase(formationSlug)}/artifacts/${artifactId}/apply`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? 'Application impossible');
      }
      return json;
    },
    onSuccess: () => {
      toast.success('Programme appliqué sur la fiche formation.');
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
          <CardTitle className="text-sm font-semibold">Assistant programme (IA)</CardTitle>
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
          Proposition structurée uniquement — aucune écriture automatique. Approuvez puis appliquez
          pour remplacer les modules du programme.
        </p>

        {artifactsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Chargement des brouillons…
          </div>
        ) : null}

        {!artifactsQuery.isLoading && artifacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun brouillon pour cette formation.</p>
        ) : null}

        {artifacts.map((artifact) => {
          const modules = artifact.payload?.modules ?? [];
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
                      <Upload className="size-3.5" aria-hidden />
                      Appliquer
                    </Button>
                  ) : null}
                </div>
              </div>
              {modules.length > 0 ? (
                <ul className="space-y-1.5 text-xs">
                  {modules.map((mod) => (
                    <li key={mod.id} className="rounded border border-border/50 px-2 py-1.5">
                      <span className="font-semibold text-foreground">
                        {mod.id} — {mod.title}
                      </span>
                      <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                        {mod.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Payload vide ou invalide.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
