'use client';

import { Layers, Wrench, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type EquipmentStockStats = {
  availableCount?: number;
  inUseCount?: number;
  maintenanceCount?: number;
  outOfServiceCount?: number;
  unitCount?: number;
  /** @deprecated — disponibles */
  currentStock?: number;
  /** @deprecated — en utilisation */
  totalIn?: number;
  /** @deprecated — en maintenance */
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
    available: stats?.availableCount ?? stats?.currentStock ?? stats?.available ?? 0,
    inUse: stats?.inUseCount ?? stats?.totalIn ?? 0,
    maintenance: stats?.maintenanceCount ?? stats?.totalOut ?? stats?.maintenance ?? 0,
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
                  s.available > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {s.available}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] max-w-[200px]">
            Disponibles (statut) — pas les entrées mouvement IN
          </TooltipContent>
        </Tooltip>

        <span className="h-3 w-px bg-border/60" aria-hidden />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <UserCheck className="size-3.5 text-sky-600 dark:text-sky-400" />
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  s.inUse > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {s.inUse}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] max-w-[200px]">
            En utilisation / affectées (statut IN_USE)
          </TooltipContent>
        </Tooltip>

        <span className="h-3 w-px bg-border/60" aria-hidden />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Wrench className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  s.maintenance > 0 ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {s.maintenance}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] max-w-[200px]">
            En maintenance (statut) — pas les sorties mouvement OUT
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
