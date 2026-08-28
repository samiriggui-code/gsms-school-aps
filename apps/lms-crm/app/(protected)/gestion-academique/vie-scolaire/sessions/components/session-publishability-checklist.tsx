'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';

type ChecklistItem = { label: string; ok: boolean; pending?: boolean };

/**
 * Checklist « session publiable » (dates, lieu, formateur, prix, docs) — idée 5,
 * branchée sur l'existant sessions/PDF (GSMS-OF-05). Informative : n'empêche pas
 * l'activation de `bookingEnabled`, mais signale une publication malgré des critères
 * manquants.
 */
export function SessionPublishabilityChecklist({ row }: { row: FormationSessionApiRow }) {
  const docsQuery = useQuery({
    queryKey: ['session-publishability-docs', row.id],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/${row.id}/publishability`,
      );
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<{ hasDocuments: boolean }>(await res.json());
    },
    staleTime: 30_000,
  });

  const items: ChecklistItem[] = [
    { label: 'Dates de session définies', ok: Boolean(row.startDate && row.endDate) },
    { label: 'Lieu renseigné', ok: Boolean(row.location?.trim()) },
    { label: 'Formateur assigné', ok: Boolean(row.trainerUserId) },
    {
      label: 'Tarif renseigné',
      ok: typeof row.catalogPriceFrom === 'number' && row.catalogPriceFrom > 0,
    },
    {
      label: 'Documents de session générés',
      ok: Boolean(docsQuery.data?.hasDocuments),
      pending: docsQuery.isLoading,
    },
  ];

  const resolvedCount = items.filter((i) => !i.pending).length;
  const okCount = items.filter((i) => !i.pending && i.ok).length;
  const allResolved = resolvedCount === items.length;
  const allOk = allResolved && okCount === items.length;

  const tone = !allResolved
    ? 'pending'
    : allOk
      ? 'ok'
      : row.bookingEnabled
        ? 'warning'
        : 'incomplete';

  const toneClass = {
    ok: 'border-green-200 bg-green-50 dark:bg-green-950/20',
    warning: 'border-destructive/30 bg-destructive/5',
    incomplete: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
    pending: 'border-border/70',
  }[tone];

  return (
    <Card className={cn('shadow-none', toneClass)}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Session publiable
          </span>
          {row.bookingEnabled ? (
            <Badge variant="success" size="sm" appearance="light">
              Publiée
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Non publiée
            </Badge>
          )}
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {okCount}/{items.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {tone === 'warning' ? (
          <div className="mb-1 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
            <p className="text-[11px] font-medium text-destructive">
              Session publiée (visible catalogue) alors que la checklist n&apos;est pas complète.
            </p>
          </div>
        ) : null}
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              {item.pending ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
              ) : item.ok ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-green-600" aria-hidden />
              ) : (
                <XCircle className="size-3.5 shrink-0 text-destructive" aria-hidden />
              )}
              <span
                className={cn(
                  'text-foreground',
                  !item.pending && !item.ok && 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
