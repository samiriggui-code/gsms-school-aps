'use client';

import {
  Users,
  BookOpen,
  Calendar,
  CalendarClock,
  DoorOpen,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SchoolStatsPayload } from '@/lib/company-profile';

interface ProfilStatsProps {
  variant?: 'grid' | 'row';
  stats?: SchoolStatsPayload | null;
  isLoading?: boolean;
}

const TILES: {
  key: keyof SchoolStatsPayload;
  label: string;
  sub: string;
  Icon: LucideIcon;
}[] = [
  {
    key: 'trainersCount',
    label: 'Formateurs',
    sub: 'Comptes avec profil formateur actif',
    Icon: Users,
  },
  {
    key: 'activeFormationsCount',
    label: 'Formations catalogue',
    sub: 'Fiches statut « actif »',
    Icon: BookOpen,
  },
  {
    key: 'sessionsTotalCount',
    label: 'Sessions',
    sub: 'Toutes sessions planifiées',
    Icon: Calendar,
  },
  {
    key: 'sessionsUpcomingOrUndatedCount',
    label: 'Sessions à venir',
    sub: 'Début ≥ aujourd’hui ou dates à compléter',
    Icon: CalendarClock,
  },
  {
    key: 'roomsAvailableCount',
    label: 'Salles',
    sub: 'Espaces pédagogiques actifs',
    Icon: DoorOpen,
  },
];

const iconAccents = [
  { orb: 'bg-sky-500/10', box: 'bg-sky-500/15 border-sky-500/25', icon: 'text-sky-600 dark:text-sky-400', pulse: 'bg-sky-500/50' },
  { orb: 'bg-emerald-500/10', box: 'bg-emerald-500/15 border-emerald-500/25', icon: 'text-emerald-600 dark:text-emerald-400', pulse: 'bg-emerald-500/50' },
  { orb: 'bg-amber-500/10', box: 'bg-amber-500/15 border-amber-500/25', icon: 'text-amber-600 dark:text-amber-400', pulse: 'bg-amber-500/50' },
  { orb: 'bg-orange-500/10', box: 'bg-orange-500/15 border-orange-500/25', icon: 'text-orange-600 dark:text-orange-400', pulse: 'bg-orange-500/50' },
  { orb: 'bg-violet-500/10', box: 'bg-violet-500/15 border-violet-500/25', icon: 'text-violet-600 dark:text-violet-400', pulse: 'bg-violet-500/50' },
];

export function ProfilStats({ variant = 'grid', stats, isLoading }: ProfilStatsProps) {
  const gridClasses =
    variant === 'row'
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full'
      : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 h-full items-stretch';

  if (isLoading || stats == null) {
    return (
      <div className={gridClasses}>
        {TILES.map((t) => (
          <div key={t.key} className="rounded-xl border border-border/70 px-4 py-4">
            <Skeleton className="h-8 w-8 rounded-lg mb-3" />
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {TILES.map((tile, index) => {
        const Icon = tile.Icon;
        const value = stats[tile.key];
        const accent = iconAccents[index % iconAccents.length];
        return (
          <div
            key={tile.key}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{tile.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tile.sub}</p>
              </div>
              <div className={cn('size-10 shrink-0 rounded-lg flex items-center justify-center border', accent.box)}>
                <Icon className={cn('size-5', accent.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
