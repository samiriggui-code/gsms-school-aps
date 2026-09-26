'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Button } from '@repo/ui/button';
import type { QualiopiCoveragePayload, QualiopiLinkAggregateStatus } from '@/lib/of/qualiopi-coverage';
import { QualiopiGapsAssistantPanel } from './qualiopi-gaps-assistant-panel';

const COVERAGE_QUERY_KEY = ['qualiopi-coverage-page'] as const;

function LinkStatusBadge({
  status,
  confidence,
}: {
  status: QualiopiLinkAggregateStatus;
  confidence: number | null;
}) {
  const styles: Record<QualiopiLinkAggregateStatus, string> = {
    VERIFIED: 'bg-emerald-100 text-emerald-900',
    AUTO: 'bg-sky-100 text-sky-900',
    SUGGESTED: 'bg-amber-100 text-amber-900',
    REJECTED: 'bg-zinc-200 text-zinc-500 line-through',
    NONE: 'bg-muted text-muted-foreground',
  };
  const labels: Record<QualiopiLinkAggregateStatus, string> = {
    VERIFIED: 'Vérifié',
    AUTO: 'Auto',
    SUGGESTED: 'Suggéré',
    REJECTED: 'Rejeté',
    NONE: '—',
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium ${styles[status]}`}
      title={confidence != null ? `confidence ${confidence}` : undefined}
    >
      {labels[status]}
      {confidence != null && status === 'SUGGESTED'
        ? ` · ${Math.round(confidence * 100)}%`
        : ''}
    </span>
  );
}

export function QualiopiCouverturePageClient() {
  const coverageQuery = useQuery({
    queryKey: COVERAGE_QUERY_KEY,
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi/coverage');
      if (!res.ok) throw new Error('coverage');
      return unwrapSectionApiData<QualiopiCoveragePayload>(await res.json());
    },
    staleTime: 60_000,
  });

  if (coverageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de la couverture Qualiopi…
      </div>
    );
  }

  if (coverageQuery.isError || !coverageQuery.data) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-sm">
        <p className="font-medium text-destructive">Impossible de charger la couverture Qualiopi.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void coverageQuery.refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  const data = coverageQuery.data;

  return (
    <>
      <p className="text-muted-foreground mb-4 text-sm">
        G9 — {data.referentialVersion} : preuves liées via EvidenceIndicatorLink (
        {data.coveredCount}/{data.totalIndicators}, {data.coveragePct} %). Les liens se créent sur les
        nouveaux changements de statut du classeur — pas de migration legacy.
      </p>
      <div className="mb-6">
        <QualiopiGapsAssistantPanel />
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.coveredCount}</div>
          <div className="text-muted-foreground text-sm">Indicateurs couverts</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.uncoveredCount}</div>
          <div className="text-muted-foreground text-sm">Sans preuve liée</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.coveragePct} %</div>
          <div className="text-muted-foreground text-sm">Taux de couverture</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Code</th>
              <th className="p-2 font-medium">Indicateur</th>
              <th className="p-2 font-medium">Preuves</th>
              <th className="p-2 font-medium">Dernière preuve</th>
              <th className="p-2 font-medium">Lien</th>
              <th className="p-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.indicators.map((ind) => (
              <tr key={ind.code} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{ind.code}</td>
                <td className="p-2">
                  <div className="font-medium">
                    I{String(ind.indicator).padStart(2, '0')} — {ind.label}
                  </div>
                  <div className="text-muted-foreground text-xs">Critère {ind.criterion}</div>
                </td>
                <td className="p-2">{ind.evidenceCount}</td>
                <td className="p-2 text-xs">
                  {ind.latestEvidence ? (
                    <>
                      <span className="font-mono">{ind.latestEvidence.eventName ?? '—'}</span>
                      <div className="text-muted-foreground">
                        {ind.latestEvidence.createdAt.slice(0, 10)} · {ind.latestEvidence.sourceType}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-2">
                  <LinkStatusBadge status={ind.linkStatus} confidence={ind.linkConfidence} />
                </td>
                <td className="p-2 text-xs">{ind.covered ? 'couvert' : 'non couvert'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        API :{' '}
        <code className="font-mono">GET /api/sections/gestion-ressources/qualiopi/coverage</code>
      </p>
    </>
  );
}

export function QualiopiCouvertureToolbarActions() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/qualiopi/referentiel/classeur">Classeur</Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/qualiopi">Retour Qualiopi</Link>
      </Button>
    </div>
  );
}
