'use client';

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, Clock, GraduationCap, MapPin, Users } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent } from '@repo/ui/card';
import { Separator } from '@repo/ui/separator';
import { FormationSessionTrainerSummary } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-trainer-summary';
import { FormationSessionVenueRoomSummary } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-venue-room-summary';
import {
  SUIVI_SESSION_KIND_LABELS,
  type SuiviSessionContext,
} from '@/lib/suivi-formations/session-suivi-context-types';
import { SUIVI_SESSION_PHASE_LABELS } from '../types/suivi-formations-api';
import { cn } from '@/lib/utils';

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'd MMM yyyy · HH:mm', { locale: fr });
  } catch {
    return '—';
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'd MMM yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-tight text-muted-foreground/80">
        {label}
      </span>
      <span className="min-w-0 text-end text-[11px] font-medium leading-snug text-foreground">{value}</span>
    </div>
  );
}

function KpiCell({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  hint?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 sm:p-3.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0 opacity-70" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{value}</p>
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SuiviSessionContextPanel({
  context,
  variant = 'default',
  dayDateLabel,
  showPlanning = true,
  className,
}: {
  context: SuiviSessionContext;
  /** `compact` : en-tête sheet journal ; `default` : dépôt document / page */
  variant?: 'default' | 'compact';
  /** Jour journal affiché (sheet journal uniquement). */
  dayDateLabel?: string | null;
  showPlanning?: boolean;
  className?: string;
}) {
  const capacityHint =
    context.traineesMin != null && context.traineesMax != null
      ? `Capacité ${context.traineesMin}–${context.traineesMax}`
      : null;
  const roomName = context.venueRoom?.name?.trim() || context.locationDisplay;
  const kindLabel = SUIVI_SESSION_KIND_LABELS[context.sessionKind] ?? context.sessionKind;
  const phaseLabel = SUIVI_SESSION_PHASE_LABELS[context.phase];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary" appearance="outline" className="gap-1 text-[11px]">
          <GraduationCap className="size-3" />
          {context.formationName}
        </Badge>
        <Badge variant="secondary" appearance="outline" className="text-[11px]">
          {phaseLabel}
        </Badge>
        <Badge variant="secondary" appearance="light" className="text-[11px]">
          {kindLabel}
        </Badge>
        {dayDateLabel ? (
          <Badge variant="secondary" appearance="light" className="gap-1 text-[11px]">
            <CalendarDays className="size-3" />
            Jour : {dayDateLabel}
          </Badge>
        ) : null}
      </div>

      {context.sessionSubtitle?.trim() ? (
        <p className="text-xs text-muted-foreground">{context.sessionSubtitle}</p>
      ) : null}

      <Card className="overflow-hidden rounded-lg border-border/70 bg-accent/30 p-0.5 shadow-none">
        <CardContent className="rounded-[calc(var(--radius)-2px)] border border-border/60 bg-background p-0">
          <div
            className={cn(
              'grid',
              variant === 'compact' ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4',
            )}
          >
            <KpiCell
              icon={Clock}
              value={context.formationDuration?.trim() || '—'}
              label="Durée formation"
              hint="Référentiel catalogue"
            />
            <KpiCell
              icon={Users}
              value={String(context.participantCount)}
              label="Stagiaires confirmés"
              hint={capacityHint}
            />
            <KpiCell
              icon={MapPin}
              value={roomName}
              label="Lieu / salle"
              hint={
                context.venueRoom?.floorLabel
                  ? `Étage ${context.venueRoom.floorLabel}`
                  : context.venueRoom?.shortCode
                    ? `Code ${context.venueRoom.shortCode}`
                    : null
              }
            />
            <KpiCell
              icon={CalendarDays}
              value={formatDate(context.startDate)}
              label="Début session"
              hint={context.endDate ? `Fin ${formatDate(context.endDate)}` : null}
            />
          </div>
        </CardContent>
      </Card>

      <div
        className={cn(
          'grid gap-3',
          variant === 'compact' ? 'lg:grid-cols-2' : 'lg:grid-cols-2',
        )}
      >
        <FormationSessionTrainerSummary
          layout="moyens"
          trainerName={context.trainerName}
          trainerEmail={context.trainerEmail}
          trainerAvatar={context.trainerAvatar}
        />
        <FormationSessionVenueRoomSummary
          layout="moyens"
          roomName={context.venueRoom?.name ?? context.locationDisplay}
          imageUrl={context.venueRoom?.imageUrl}
        />
      </div>

      {showPlanning ? (
        <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Planning session
          </p>
          <div className="grid gap-0 sm:grid-cols-2">
            <div>
              <MetaRow label="Libellé session" value={context.dateDisplayLabel || '—'} />
              <Separator className="opacity-40" />
              <MetaRow label="Début" value={formatDateTime(context.startDate)} />
              <Separator className="opacity-40" />
              <MetaRow label="Fin" value={formatDateTime(context.endDate)} />
            </div>
            <div className="sm:border-s sm:border-border/40 sm:ps-4">
              <MetaRow label="Clôture inscriptions" value={formatDateTime(context.registrationClosesAt)} />
              <Separator className="opacity-40" />
              <MetaRow label="Examen prévu" value={formatDateTime(context.examDate)} />
              <Separator className="opacity-40" />
              <MetaRow
                label="Capacité"
                value={
                  context.traineesMin != null && context.traineesMax != null
                    ? `${context.traineesMin} – ${context.traineesMax} places`
                    : '—'
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
