'use client';

import { ArrowDownLeft, ArrowUpRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type EquipmentStockStats = {
  currentStock?: number;
  totalIn?: number;
  totalOut?: number;
  available?: number;
  maintenance?: number;
};

export function EquipmentStockStatsCell({
  stats,
  unitCount,
  compact = false,
}: {
  stats?: EquipmentStockStats | null;
  unitCount?: number | null;
  compact?: boolean;
}) {
  const s = {
    currentStock: stats?.currentStock ?? stats?.available ?? 0,
    totalIn: stats?.totalIn ?? 0,
    totalOut: stats?.totalOut ?? stats?.maintenance ?? 0,
  };

  if (!stats && unitCount == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-2.5')}>
        {unitCount != null && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground tabular-nums">
              {unitCount} u.
            </span>
            <span className="h-3 w-px bg-border/60" aria-hidden />
          </>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Layers className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  s.currentStock > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {s.currentStock}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px]">Disponibles</TooltipContent>
        </Tooltip>

        <span className="h-3 w-px bg-border/60" aria-hidden />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <ArrowDownLeft className="size-3.5 text-sky-600 dark:text-sky-400" />
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  s.totalIn > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {s.totalIn}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px]">Affectées / en utilisation</TooltipContent>
        </Tooltip>

        <span className="h-3 w-px bg-border/60" aria-hidden />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <ArrowUpRight className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  s.totalOut > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {s.totalOut}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px]">En maintenance</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
