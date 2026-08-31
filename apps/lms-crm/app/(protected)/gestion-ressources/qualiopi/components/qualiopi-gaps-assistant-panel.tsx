'use client';

import { useQuery } from '@tanstack/react-query';
import { HelpCircle, Loader2 } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QualiopiGapsPayload } from '@/lib/of/qualiopi-gaps';

/** GSMS-AI-04 — assistant gaps couverture (déterministe, lecture seule). */
export function QualiopiGapsAssistantPanel() {
  const gapsQuery = useQuery({
    queryKey: ['qualiopi-gaps'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi/gaps');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<QualiopiGapsPayload>(await res.json());
    },
    staleTime: 60_000,
  });

  const data = gapsQuery.data;

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5 shadow-none">
      <CardHeader className="flex-row items-center gap-2 space-y-0 py-3">
        <HelpCircle className="size-4 text-primary" aria-hidden />
        <CardTitle className="text-sm font-semibold">Assistant couverture (lecture seule)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Question P0 : « Qu’est-ce qui manque ? » — calculé depuis EvidenceIndicatorLink, sans LLM.
          Ce n’est pas un audit OK/KO.
        </p>

        {gapsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Analyse de la couverture…
          </div>
        ) : null}

        {gapsQuery.isError ? (
          <p className="text-xs text-destructive">Impossible de calculer les manques.</p>
        ) : null}

        {data ? (
          <>
            <p className="text-sm text-foreground">{data.answer}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary" appearance="outline" size="sm">
                {data.coveredCount}/{data.totalIndicators} couverts
              </Badge>
              <Badge variant="secondary" appearance="outline" size="sm">
                {data.uncoveredCount} manquant(s)
              </Badge>
              <Badge variant="secondary" appearance="outline" size="sm">
                {data.coveragePct} %
              </Badge>
            </div>
            {data.gaps.length > 0 ? (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto text-xs">
                {data.gaps.map((g) => (
                  <li key={g.code} className="rounded-md border border-border/60 bg-background/80 px-2 py-1.5">
                    <span className="font-mono font-medium text-foreground">{g.code}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      — I{String(g.indicator).padStart(2, '0')} {g.label}
                    </span>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{g.why}</div>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-[10px] text-muted-foreground">{data.disclaimer}</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
