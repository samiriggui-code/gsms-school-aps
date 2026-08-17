'use client';

import { Building2, CalendarClock, Layers, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type EquipmentStockStats = {
  availableCount?: number;
  roomFixedCount?: number;
  sessionReservedCount?: number;
  maintenanceCount?: number;
  outOfServiceCount?: number;
  unitCount?: number;
  /** @deprecated — disponibles */
  currentStock?: number;
  /** @deprecated — en salle */
  inUseCount?: number;
  totalIn?: number;
  /** @deprecated — session */
  totalOut?: number;
  available?: number;
  maintenance?: number;
};

function StatChip({
  icon: Icon,
  value,
  activeClass,
  tooltip,
}: {
  icon: typeof Layers;
  value: number;
  activeClass: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-help">
          <Icon className={cn('size-3.5', value > 0 ? activeClass : 'text-muted-foreground/30')} />
          <span
            className={cn(
              'text-xs font-semibold tabular-nums',
              value > 0 ? 'text-foreground' : 'text-muted-foreground/40',
            )}
          >
            {value}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-[10px] max-w-[220px]">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function EquipmentStockStatsCell({
  stats,
  unitCount,
  compact = false,
  /** Inventaire catalogue : pas de colonne « salle » (affectation = fiche salle uniquement). */
  catalogView = false,
}: {
  stats?: EquipmentStockStats | null;
  unitCount?: number | null;
  compact?: boolean;
  catalogView?: boolean;
}) {
  const s = {
    available: stats?.availableCount ?? stats?.currentStock ?? stats?.available ?? 0,
    room: stats?.roomFixedCount ?? stats?.inUseCount ?? stats?.totalIn ?? 0,
    session: stats?.sessionReservedCount ?? stats?.totalOut ?? 0,
    maintenance: stats?.maintenanceCount ?? stats?.maintenance ?? 0,
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
        <StatChip
          icon={Layers}
          value={s.available}
          activeClass="text-emerald-600 dark:text-emerald-400"
          tooltip="Disponibles — non réservées (session ou autre)"
        />
        {!catalogView ? (
          <>
            <span className="h-3 w-px bg-border/60" aria-hidden />
            <StatChip
              icon={Building2}
              value={s.room}
              activeClass="text-violet-600 dark:text-violet-400"
              tooltip="Installées en salle (fiche salle — pas le catalogue)"
            />
          </>
        ) : null}
        <span className="h-3 w-px bg-border/60" aria-hidden />
        <StatChip
          icon={CalendarClock}
          value={s.session}
          activeClass="text-sky-600 dark:text-sky-400"
          tooltip="Réservées pour une session de formation (décomptées du stock dispo)"
        />
        <span className="h-3 w-px bg-border/60" aria-hidden />
        <StatChip
          icon={Wrench}
          value={s.maintenance}
          activeClass="text-amber-600 dark:text-amber-400"
          tooltip="En maintenance ou hors service"
        />
      </div>
    </TooltipProvider>
  );
}
