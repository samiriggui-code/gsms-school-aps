'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import {
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  UserCheck,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SuiviFormationsStatsPayload } from '../types/suivi-formations-api';

export const suiviFormationsStatsQueryKey = (sessionId: string | null) =>
  ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'stats', sessionId] as const;

export function SuiviFormationsStats({
  sessionId,
  variant = 'row',
}: {
  sessionId: string | null;
  variant?: 'grid' | 'row';
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: suiviFormationsStatsQueryKey(sessionId),
    queryFn: async (): Promise<SuiviFormationsStatsPayload> => {
      if (!sessionId) throw new Error('Session requise.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/stats`,
      );
      if (!res.ok) throw new Error('Indicateurs suivi indisponibles.');
      const j = await res.json();
      if (!j?.success || !j?.data) throw new Error('Réponse stats invalide.');
      return j.data as SuiviFormationsStatsPayload;
    },
    enabled: Boolean(sessionId),
    staleTime: 60_000,
  });

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 h-full items-stretch';

  if (!sessionId) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
        Sélectionnez une session pour afficher les indicateurs de suivi.
      </div>
    );
  }

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

  const cards = [
    {
      title: 'Stagiaires inscrits',
      value: data.participantsTotal,
      subtitle: data.formationName,
      Icon: Users,
    },
    {
      title: 'Progression e-learning',
      value: `${data.avgProgressPercent} %`,
      subtitle: 'Moyenne UV complétées',
      Icon: BookOpenCheck,
    },
    {
      title: 'Présents aujourd’hui',
      value: data.presentToday,
      subtitle: 'Marqués présents ou en retard',
      Icon: UserCheck,
    },
    {
      title: 'Émargement du jour',
      value: `${data.emargementSlotsCompleted}/${data.emargementSlotsTotal}`,
      subtitle: 'Créneaux matin / soir complétés',
      Icon: ClipboardCheck,
    },
    {
      title: 'Quiz validés',
      value: `${data.avgQuizCompletionPercent} %`,
      subtitle: 'Moyenne par stagiaire',
      Icon: GraduationCap,
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
