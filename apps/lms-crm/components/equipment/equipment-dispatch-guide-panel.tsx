'use client';

import { AlertCircle, CheckCircle2, CircleDashed, Link2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DispatchGuideLine } from '@/lib/equipment-dispatch-guide';
import { cn } from '@/lib/utils';

const STATUS_META: Record<
  DispatchGuideLine['status'],
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }
> = {
  complete: { label: 'Complet', variant: 'success' },
  partial: { label: 'Partiel', variant: 'warning' },
  missing: { label: 'À lier', variant: 'secondary' },
  insufficient_stock: { label: 'Stock insuffisant', variant: 'destructive' },
};

export type EquipmentDispatchGuideData = {
  profileLabel?: string;
  periodLabel?: string;
  helpText?: string;
  summary: { total: number; complete: number; insufficient: number; percent: number };
  lines: DispatchGuideLine[];
};

export function EquipmentDispatchGuidePanel({
  data,
  isLoading,
  title = 'Assistant dispatch',
  onAssignCategory,
  compact = false,
}: {
  data?: EquipmentDispatchGuideData | null;
  isLoading?: boolean;
  title?: string;
  onAssignCategory?: (catalogKey: string, catalogLabel: string) => void;
  compact?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="shadow-none border border-primary/20 bg-primary/5">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Analyse des besoins…
        </CardContent>
      </Card>
    );
  }

  if (!data?.lines?.length) return null;

  const { summary, lines, helpText, profileLabel, periodLabel } = data;

  return (
    <Card className="shadow-none border border-primary/25 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className={cn('pb-2', compact && 'py-3')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="size-4 text-primary" />
              {title}
            </CardTitle>
            {profileLabel ? (
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide font-semibold">
                Profil : {profileLabel}
              </p>
            ) : null}
            {periodLabel ? (
              <p className="text-[10px] text-muted-foreground mt-0.5">{periodLabel}</p>
            ) : null}
          </div>
          <Badge variant="outline" className="tabular-nums text-[10px] font-bold">
            {summary.complete}/{summary.total} lignes OK
          </Badge>
        </div>
        <Progress value={summary.percent} className="h-1.5 mt-3" />
      </CardHeader>
      <CardContent className={cn('space-y-3', compact && 'pt-0 pb-3')}>
        {helpText ? (
          <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
            {helpText}
          </p>
        ) : null}

        <div className="space-y-2">
          {lines.map((line) => {
            const meta = STATUS_META[line.status];
            const Icon =
              line.status === 'complete'
                ? CheckCircle2
                : line.status === 'insufficient_stock'
                  ? AlertCircle
                  : CircleDashed;

            return (
              <div
                key={`${line.catalogKey}-${line.scope}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs"
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    line.status === 'complete' && 'text-emerald-600',
                    line.status === 'insufficient_stock' && 'text-destructive',
                    (line.status === 'partial' || line.status === 'missing') && 'text-amber-600',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{line.catalogLabel}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {line.kind === 'FIXED' ? 'Fixe salle' : 'Mobile session'} · {line.reason}
                  </p>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <p className="font-bold">
                    {line.quantityAssigned}/{line.quantity}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    stock libre : {line.quantityAvailableGlobal}
                  </p>
                </div>
                <Badge variant={meta.variant} appearance="light" size="sm" className="text-[9px]">
                  {meta.label}
                </Badge>
                {onAssignCategory &&
                line.kind === 'FIXED' &&
                line.status !== 'complete' &&
                line.quantityAvailableGlobal > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    onClick={() => onAssignCategory(line.catalogKey, line.catalogLabel)}
                  >
                    <Link2 className="size-3 mr-1" />
                    Lier
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {summary.insufficient > 0 ? (
          <p className="text-[10px] text-destructive font-medium flex items-center gap-1">
            <AlertCircle className="size-3.5" />
            {summary.insufficient} catégorie(s) sans assez d&apos;unités en stock global — réapprovisionnez
            l&apos;inventaire ou ajustez la capacité.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
