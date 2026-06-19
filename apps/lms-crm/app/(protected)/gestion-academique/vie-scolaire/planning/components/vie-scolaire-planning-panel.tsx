'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addWeeks,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import {
  classifyVenueRoomUsage,
  venueUsageLabelFr,
  type VenueRoomUsageKind,
} from '@repo/api-core/venue-room-usage';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  frenchPublicHolidayLabel,
  getSchoolPlanningDayKind,
  getSchoolPlanningDays,
  isFrenchPublicHoliday,
  isSaturday,
  isSchoolClosedForPlanning,
  schoolPlanningWeekEnd,
} from '@/lib/gestion-ressources/french-school-calendar';
import { VieScolairePlanningStats } from './vie-scolaire-planning-stats';

type PlanningSession = {
  id: string;
  dateDisplayLabel: string;
  sessionKind: string | null;
  sessionSubtitle: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  formationName: string | null;
  trainerName: string | null;
  venueRoomName: string | null;
  venueRoomCode: string | null;
  participantsCount: number;
};

type PlanningPayload = {
  from: string;
  to: string;
  items: PlanningSession[];
  summary: {
    sessionCount: number;
    participantsTotal: number;
    withoutTrainer: number;
    withoutRoom: number;
  };
};

const USAGE_STYLES: Record<VenueRoomUsageKind, string> = {
  formation:
    'border-sky-500/50 bg-sky-500/10 text-sky-950 dark:text-sky-100 hover:bg-sky-500/20',
  reunion_info:
    'border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100 hover:bg-amber-500/20',
  reunion_personnel:
    'border-violet-500/50 bg-violet-500/10 text-violet-950 dark:text-violet-100 hover:bg-violet-500/20',
  autre:
    'border-border bg-muted/40 text-foreground hover:bg-muted/60',
};

const USAGE_LEGEND_DOT: Record<VenueRoomUsageKind, string> = {
  formation: 'bg-sky-500/60 border-sky-500/80',
  reunion_info: 'bg-amber-500/60 border-amber-500/80',
  reunion_personnel: 'bg-violet-500/60 border-violet-500/80',
  autre: 'bg-muted border-border',
};

const GRID_COLS = 'minmax(200px,260px) repeat(6, minmax(100px,1fr))';

function sessionCoversDay(session: PlanningSession, day: Date): boolean {
  if (!session.startDate || !session.endDate) return false;
  const start = startOfDay(new Date(session.startDate));
  const end = startOfDay(new Date(session.endDate));
  const d = startOfDay(day);
  return d >= start && d <= end;
}

function dayHeaderLabel(day: Date): string {
  if (isSaturday(day)) return 'Sam. (ponctuel)';
  return format(day, 'EEE', { locale: fr });
}

function closedCellLabel(day: Date, hasSessions: boolean): string {
  const holiday = frenchPublicHolidayLabel(day);
  if (holiday) return `Fermé — ${holiday}`;
  if (isSaturday(day)) {
    return hasSessions ? 'Ouvert (samedi)' : 'Fermé';
  }
  return 'Fermé';
}

function sessionUsage(session: PlanningSession): VenueRoomUsageKind {
  return classifyVenueRoomUsage({
    sessionKind: session.sessionKind,
    sessionSubtitle: session.sessionSubtitle,
    dateDisplayLabel: session.dateDisplayLabel,
    location: session.location,
    formationName: session.formationName,
  });
}

export function VieScolairePlanningPanel() {
  const [weekAnchor, setWeekAnchor] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekStart = useMemo(
    () => startOfWeek(weekAnchor, { weekStartsOn: 1 }),
    [weekAnchor],
  );
  const weekEnd = useMemo(() => schoolPlanningWeekEnd(weekStart), [weekStart]);
  const days = useMemo(() => getSchoolPlanningDays(weekStart), [weekStart]);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['vie-scolaire-planning', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: format(weekStart, 'yyyy-MM-dd'),
        to: format(weekEnd, 'yyyy-MM-dd'),
      });
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/planning?${params}`,
      );
      if (!res.ok) throw new Error('Planning indisponible');
      const json = await res.json();
      return json?.data as PlanningPayload;
    },
  });

  const sessions = data?.items ?? [];

  const weekLabel = `Semaine du ${format(weekStart, 'd MMMM', { locale: fr })} au ${format(weekEnd, 'd MMMM yyyy', { locale: fr })} — lun.–ven. ouvrés, sam. ponctuel, dim. fermé`;

  return (
    <div className="space-y-5 lg:space-y-7.5">
      <VieScolairePlanningStats summary={data?.summary} isLoading={isLoading} />

      <Card className="shadow-none border-border overflow-hidden">
        <CardHeader className="py-4 border-b border-border/60 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Planning pédagogique</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{weekLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setWeekAnchor(subWeeks(weekAnchor, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-semibold"
                onClick={() => setWeekAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Aujourd&apos;hui
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setWeekAnchor(addWeeks(weekAnchor, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 gap-1.5 text-xs font-bold"
                asChild
              >
                <Link href="/gestion-academique/vie-scolaire/sessions">Gérer les sessions</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                disabled={isRefetching}
                onClick={() => void refetch()}
              >
                <RotateCcw className={cn('size-3.5', isRefetching && 'animate-spin')} />
                Sync
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {(Object.keys(USAGE_STYLES) as VenueRoomUsageKind[]).map((kind) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className={cn('size-2.5 rounded-sm border', USAGE_LEGEND_DOT[kind])} />
                {venueUsageLabelFr(kind)}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border bg-muted border-border" />
              Hors session
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border bg-muted border-border" />
              Fermé / férié
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <Loader2 className="inline size-4 animate-spin mr-2" />
              Chargement du planning…
            </div>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Impossible de charger le planning pédagogique.
            </p>
          ) : sessions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground px-4">
              Aucune session planifiée sur cette semaine — créez une session dans l&apos;onglet
              Sessions ou consultez une autre période.
            </p>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-[900px]">
                <div
                  className="grid border-b border-border/60 bg-muted/20"
                  style={{ gridTemplateColumns: GRID_COLS }}
                >
                  <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/60">
                    Formation / session
                  </div>
                  {days.map((day) => {
                    const kind = getSchoolPlanningDayKind(day);
                    const holiday = frenchPublicHolidayLabel(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'px-2 py-3 text-center border-r border-border/40 last:border-r-0',
                          isToday(day) && kind !== 'closed_holiday' && 'bg-primary/5',
                          kind === 'closed_holiday' && 'bg-muted/60',
                          kind === 'saturday' && 'bg-amber-500/[0.06]',
                        )}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {dayHeaderLabel(day)}
                        </p>
                        <p
                          className={cn(
                            'text-sm font-bold mt-0.5',
                            isToday(day) ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {format(day, 'd MMM', { locale: fr })}
                        </p>
                        {holiday ? (
                          <p className="text-[9px] font-semibold text-rose-600 dark:text-rose-400 mt-1 leading-tight">
                            {holiday}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {sessions.map((session) => {
                  const usage = sessionUsage(session);
                  const roomLabel =
                    [session.venueRoomCode, session.venueRoomName].filter(Boolean).join(' · ') ||
                    'Salle non affectée';

                  return (
                    <div
                      key={session.id}
                      className="grid border-b border-border/40 last:border-b-0"
                      style={{ gridTemplateColumns: GRID_COLS }}
                    >
                      <div className="px-4 py-3 border-r border-border/60 bg-background sticky left-0 z-[1]">
                        <p className="text-sm font-bold text-foreground leading-tight">
                          {session.formationName || 'Formation'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {session.dateDisplayLabel}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                          {[
                            session.trainerName || 'Sans formateur',
                            `${session.participantsCount} inscrit(s)`,
                            roomLabel,
                          ].join(' · ')}
                        </p>
                      </div>

                      {days.map((day) => {
                        const active = sessionCoversDay(session, day);
                        const closed = isSchoolClosedForPlanning(day, active);
                        const holiday = isFrenchPublicHoliday(day);

                        return (
                          <div
                            key={`${session.id}-${day.toISOString()}`}
                            className={cn(
                              'min-h-[88px] p-1.5 border-r border-border/30 last:border-r-0 align-top',
                              isToday(day) && !closed && 'bg-primary/[0.03]',
                              !active && closed && 'bg-muted/40',
                              !active && !closed && 'bg-background',
                              active && closed && 'bg-rose-500/[0.06]',
                            )}
                          >
                            {!active ? (
                              <span
                                className={cn(
                                  'block text-[10px] font-medium px-1 py-2 leading-snug text-muted-foreground',
                                )}
                              >
                                {closed ? closedCellLabel(day, false) : '—'}
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {closed ? (
                                  <p className="text-[9px] font-bold uppercase text-rose-600/90 dark:text-rose-400 px-0.5">
                                    {closedCellLabel(day, true)}
                                  </p>
                                ) : null}
                                <Link
                                  href={`/gestion-academique/vie-scolaire/sessions?id=${session.id}`}
                                  className={cn(
                                    'block rounded-md border px-2 py-1.5 text-[10px] leading-snug transition-colors',
                                    USAGE_STYLES[usage],
                                    holiday && closed && 'ring-1 ring-rose-400/50',
                                  )}
                                  title={[
                                    session.formationName,
                                    session.dateDisplayLabel,
                                    venueUsageLabelFr(usage),
                                    session.trainerName,
                                    `${session.participantsCount} inscrit(s)`,
                                    roomLabel,
                                    holiday ? `Attention : ${holiday}` : undefined,
                                  ]
                                    .filter(Boolean)
                                    .join(' — ')}
                                >
                                  <span className="font-bold block line-clamp-2">
                                    {session.formationName || session.dateDisplayLabel}
                                  </span>
                                  <span className="opacity-80 block line-clamp-1">
                                    {venueUsageLabelFr(usage)}
                                  </span>
                                  {session.startDate &&
                                  session.endDate &&
                                  !isSameDay(
                                    new Date(session.startDate),
                                    new Date(session.endDate),
                                  ) ? (
                                    <span className="opacity-70 block mt-0.5">
                                      {format(new Date(session.startDate), 'd/MM')} →{' '}
                                      {format(new Date(session.endDate), 'd/MM')}
                                    </span>
                                  ) : null}
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
