'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { ChevronLeft, ChevronRight, Loader2, RotateCcw, X } from 'lucide-react';
import {
  classifyVenueRoomUsage,
  venueUsageLabelFr,
  type VenueRoomUsageKind,
} from '@repo/api-core/venue-room-usage';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader } from '@repo/ui/card';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
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

type PlanningSession = {
  id: string;
  label: string;
  formationName: string | null;
  sessionKind: string | null;
  sessionSubtitle: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  trainerName: string | null;
};

type PlanningBooking = {
  id: string;
  title: string;
  kind: string;
  startAt: string;
  endAt: string;
  notes: string | null;
  organizerName: string | null;
  source: 'booking';
};

type PlanningRoom = {
  id: string;
  name: string;
  shortCode: string | null;
  capacity: number | null;
  floorLabel: string | null;
  sessions: PlanningSession[];
  bookings?: PlanningBooking[];
};

type PlanningPayload = {
  from: string;
  to: string;
  rooms: PlanningRoom[];
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

const GRID_COLS = 'minmax(180px,220px) repeat(6, minmax(100px,1fr))';

function sessionCoversDay(session: PlanningSession, day: Date): boolean {
  if (!session.startDate || !session.endDate) return false;
  const start = startOfDay(new Date(session.startDate));
  const end = startOfDay(new Date(session.endDate));
  const d = startOfDay(day);
  return d >= start && d <= end;
}

function sessionsForDay(sessions: PlanningSession[], day: Date): PlanningSession[] {
  return sessions.filter((s) => sessionCoversDay(s, day));
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

function bookingCoversDay(booking: PlanningBooking, day: Date): boolean {
  const start = startOfDay(new Date(booking.startAt));
  const end = startOfDay(new Date(booking.endAt));
  const d = startOfDay(day);
  return d >= start && d <= end;
}

function bookingsForDay(bookings: PlanningBooking[] | undefined, day: Date): PlanningBooking[] {
  return (bookings ?? []).filter((b) => bookingCoversDay(b, day));
}

function bookingUsageKind(kind: string): VenueRoomUsageKind {
  if (kind === 'STAFF_MEETING') return 'reunion_personnel';
  if (kind === 'INFO_MEETING') return 'reunion_info';
  return 'autre';
}

function bookingKindLabel(kind: string): string {
  if (kind === 'STAFF_MEETING') return 'Réunion personnel';
  if (kind === 'INFO_MEETING') return 'Réunion info';
  return 'Réservation';
}

function dayHasEvents(room: PlanningRoom, day: Date): boolean {
  return (
    sessionsForDay(room.sessions, day).length > 0 ||
    bookingsForDay(room.bookings, day).length > 0
  );
}

export function SallesPlanning({ onAddBooking }: { onAddBooking?: () => void }) {
  const queryClient = useQueryClient();
  const [weekAnchor, setWeekAnchor] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekStart = useMemo(
    () => startOfWeek(weekAnchor, { weekStartsOn: 1 }),
    [weekAnchor],
  );
  const weekEnd = useMemo(() => schoolPlanningWeekEnd(weekStart), [weekStart]);
  const days = useMemo(() => getSchoolPlanningDays(weekStart), [weekStart]);

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/bookings/${bookingId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || j?.message || 'Annulation impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Réservation annulée');
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-planning'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-list'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['venue-rooms-planning', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: format(weekStart, 'yyyy-MM-dd'),
        to: format(weekEnd, 'yyyy-MM-dd'),
      });
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/planning?${params}`,
      );
      if (!res.ok) throw new Error('Planning indisponible');
      const json = await res.json();
      return json?.data as PlanningPayload;
    },
  });

  const rooms = data?.rooms ?? [];

  const weekLabel = `Semaine du ${format(weekStart, 'd MMMM', { locale: fr })} au ${format(weekEnd, 'd MMMM yyyy', { locale: fr })} — lun.–ven. ouvrés, sam. ponctuel, dim. fermé`;

  return (
    <Card className="shadow-none border-border overflow-hidden">
      <CardHeader className="py-4 border-b border-border/60 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Planning des salles</h3>
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
              onClick={onAddBooking}
            >
              Réunion staff
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
            <span className="size-2.5 rounded-sm border bg-violet-500/60 border-violet-500/80" />
            Réunion staff / ponctuelle
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border bg-emerald-500/20 border-emerald-500/40" />
            Libre (jour ouvré)
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
            Impossible de charger le planning des salles.
          </p>
        ) : rooms.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground px-4">
            Aucune salle active — créez une salle dans l&apos;onglet Référentiel.
          </p>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              <div
                className="grid border-b border-border/60 bg-muted/20"
                style={{ gridTemplateColumns: GRID_COLS }}
              >
                <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/60">
                  Salle
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

              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="grid border-b border-border/40 last:border-b-0"
                  style={{ gridTemplateColumns: GRID_COLS }}
                >
                  <div className="px-4 py-3 border-r border-border/60 bg-background sticky left-0 z-[1]">
                    <p className="text-sm font-bold text-foreground leading-tight">{room.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {[room.shortCode, room.floorLabel, room.capacity != null ? `${room.capacity} pl.` : null]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </div>

                  {days.map((day) => {
                    const daySessions = sessionsForDay(room.sessions, day);
                    const dayBookings = bookingsForDay(room.bookings, day);
                    const eventCount = daySessions.length + dayBookings.length;
                    const closed = isSchoolClosedForPlanning(day, eventCount > 0);
                    const isFree = eventCount === 0 && !closed;
                    const holiday = isFrenchPublicHoliday(day);

                    return (
                      <div
                        key={`${room.id}-${day.toISOString()}`}
                        className={cn(
                          'min-h-[88px] p-1.5 border-r border-border/30 last:border-r-0 align-top',
                          isToday(day) && !closed && 'bg-primary/[0.03]',
                          isFree && 'bg-emerald-500/[0.04]',
                          closed && !eventCount && 'bg-muted/40',
                          closed && eventCount > 0 && 'bg-rose-500/[0.06]',
                        )}
                      >
                        {eventCount === 0 ? (
                          <span
                            className={cn(
                              'block text-[10px] font-medium px-1 py-2 leading-snug',
                              isFree
                                ? 'text-emerald-700/80 dark:text-emerald-400/90'
                                : 'text-muted-foreground',
                            )}
                          >
                            {closed ? closedCellLabel(day, false) : 'Libre'}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {closed ? (
                              <p className="text-[9px] font-bold uppercase text-rose-600/90 dark:text-rose-400 px-0.5">
                                {closedCellLabel(day, true)}
                              </p>
                            ) : null}
                            {daySessions.map((session) => {
                              const usage = classifyVenueRoomUsage({
                                sessionKind: session.sessionKind,
                                sessionSubtitle: session.sessionSubtitle,
                                dateDisplayLabel: session.label,
                                location: session.location,
                                formationName: session.formationName,
                              });
                              return (
                                <Link
                                  key={`${session.id}-${format(day, 'yyyy-MM-dd')}`}
                                  href={`/gestion-academique/vie-scolaire/sessions?id=${session.id}`}
                                  className={cn(
                                    'block rounded-md border px-2 py-1.5 text-[10px] leading-snug transition-colors',
                                    USAGE_STYLES[usage],
                                    holiday && closed && eventCount > 0 &&
                                      'ring-1 ring-rose-400/50',
                                  )}
                                  title={[
                                    session.label,
                                    session.formationName,
                                    venueUsageLabelFr(usage),
                                    holiday ? `Attention : ${holiday}` : undefined,
                                  ]
                                    .filter(Boolean)
                                    .join(' — ')}
                                >
                                  <span className="font-bold block line-clamp-2">
                                    {session.formationName || session.label}
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
                              );
                            })}
                            {dayBookings.map((booking) => {
                              const usage = bookingUsageKind(booking.kind);
                              return (
                                <div
                                  key={`${booking.id}-${format(day, 'yyyy-MM-dd')}`}
                                  className={cn(
                                    'relative rounded-md border px-2 py-1.5 text-[10px] leading-snug',
                                    USAGE_STYLES[usage],
                                    holiday && closed && eventCount > 0 &&
                                      'ring-1 ring-rose-400/50',
                                  )}
                                  title={[
                                    booking.title,
                                    bookingKindLabel(booking.kind),
                                    booking.organizerName,
                                    booking.notes,
                                  ]
                                    .filter(Boolean)
                                    .join(' — ')}
                                >
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 rounded p-0.5 opacity-60 hover:opacity-100 hover:bg-background/60"
                                    aria-label="Annuler la réservation"
                                    disabled={cancelBookingMutation.isPending}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Annuler la réservation « ${booking.title} » ?`,
                                        )
                                      ) {
                                        cancelBookingMutation.mutate(booking.id);
                                      }
                                    }}
                                  >
                                    <X className="size-3" />
                                  </button>
                                  <span className="font-bold block line-clamp-2 pr-4">
                                    {booking.title}
                                  </span>
                                  <span className="opacity-80 block line-clamp-1">
                                    {bookingKindLabel(booking.kind)}
                                  </span>
                                  <span className="opacity-70 block mt-0.5">
                                    {format(new Date(booking.startAt), 'HH:mm')} →{' '}
                                    {format(new Date(booking.endAt), 'HH:mm')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
