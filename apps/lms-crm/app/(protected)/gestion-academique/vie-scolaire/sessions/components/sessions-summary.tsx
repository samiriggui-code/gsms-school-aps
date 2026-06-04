'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { CalendarRange, GraduationCap, Layers, UserRound, UserMinus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SessionsStatsPayload = {
  sessionsTotal: number;
  participantsTotal: number;
  formationsCatalogActive: number;
  sessionsWithTrainer: number;
};

export const sessionsStatsQueryKey = [
  'gestion-academique',
  'vie-scolaire',
  'sessions',
  'stats',
] as const;

export function SessionsSummary({ variant = 'grid' }: { variant?: 'grid' | 'row' }) {
  const { data, isLoading, error } = useQuery({
    queryKey: sessionsStatsQueryKey,
    queryFn: async (): Promise<SessionsStatsPayload> => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions/stats');
      if (!res.ok) throw new Error('Statistiques sessions indisponibles.');
      const j = await res.json();
      if (!j?.success || !j?.data) throw new Error('Réponse stats invalide.');
      return j.data as SessionsStatsPayload;
    },
    staleTime: 60_000,
  });

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 h-full items-stretch';

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-border/70 p-4 shadow-none">
            <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {(error as Error)?.message ?? 'Impossible de charger les indicateurs.'}
      </div>
    );
  }

  const withoutTrainer = Math.max(0, data.sessionsTotal - data.sessionsWithTrainer);

  const cards: {
    title: string;
    value: number;
    subtitle: string;
    Icon: typeof CalendarRange;
  }[] = [
    {
      title: 'Sessions planifiées',
      value: data.sessionsTotal,
      subtitle: 'Toutes sessions CRM',
      Icon: CalendarRange,
    },
    {
      title: 'Inscriptions élèves',
      value: data.participantsTotal,
      subtitle: 'Places nominales enregistrées',
      Icon: UserRound,
    },
    {
      title: 'Références catalogue',
      value: data.formationsCatalogActive,
      subtitle: 'Formations publiées éligibles',
      Icon: Layers,
    },
    {
      title: 'Avec formateur',
      value: data.sessionsWithTrainer,
      subtitle: 'Référent pédagogique assigné',
      Icon: GraduationCap,
    },
    {
      title: 'Sans formateur',
      value: withoutTrainer,
      subtitle:
        withoutTrainer > 0 ? 'Sessions sans référent assigné' : 'Toutes les sessions couvertes',
      Icon: UserMinus,
    },
  ];

  return (
    <div className={gridClasses}>
      {cards.map((c, index) => {
        const Icon = c.Icon;
        const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
        return (
          <div
            key={c.title}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{c.title}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{c.value}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.subtitle}</p>
              </div>
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                  accent.box,
                )}
              >
                <Icon className={cn('size-5', accent.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
