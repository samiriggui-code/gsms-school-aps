'use client';

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FormationSessionTrainerSummary } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-trainer-summary';
import { FormationSessionVenueRoomSummary } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-venue-room-summary';
import {
  formationExamStatusBadgeVariant,
  formationExamStatusLabel,
} from '@/lib/vie-scolaire/formation-exam-labels';
import { SUIVI_SESSION_KIND_LABELS } from '@/lib/suivi-formations/session-suivi-context-types';
import type { FormationExamDetailResponse } from '@/lib/vie-scolaire/formation-exam-detail-loader';
import { cn } from '@/lib/utils';

function formatExamDateTime(iso: string | null) {
  if (!iso) return 'Non planifiée';
  try {
    return format(parseISO(iso), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return '—';
  }
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

export function FormationExamContextPanel({
  exam,
  className,
}: {
  exam: FormationExamDetailResponse;
  className?: string;
}) {
  const ctx = exam.sessionContext;
  const kindLabel = SUIVI_SESSION_KIND_LABELS[exam.session.sessionKind] ?? exam.session.sessionKind;
  const roomName = exam.venueRoom?.name ?? null;
  const roomImage = exam.venueRoom?.imageUrl ?? null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary" appearance="outline" className="gap-1 text-[11px]">
          <GraduationCap className="size-3" />
          {exam.session.formation?.name ?? 'Formation'}
        </Badge>
        <Badge
          variant={formationExamStatusBadgeVariant(exam.status)}
          appearance="outline"
          className="text-[11px]"
        >
          {formationExamStatusLabel(exam.status)}
        </Badge>
        <Badge variant="secondary" appearance="light" className="text-[11px]">
          {kindLabel}
        </Badge>
        <Badge variant="secondary" appearance="light" className="gap-1 text-[11px]">
          <CalendarDays className="size-3" />
          {exam.session.dateDisplayLabel}
        </Badge>
      </div>

      {!exam.planningComplete ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-900 dark:text-amber-100">
              <p className="font-semibold">Planification incomplète</p>
              <ul className="list-disc ps-4 space-y-0.5">
                {exam.planningWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
          <CheckCircle2 className="size-4 shrink-0" />
          Examen prêt : date, salle et candidats renseignés.
        </div>
      )}

      <Card className="overflow-hidden rounded-lg border-border/70 bg-accent/30 p-0.5 shadow-none">
        <CardContent className="rounded-[calc(var(--radius)-2px)] border border-border/60 bg-background p-0">
          <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <KpiCell
              icon={Users}
              value={String(exam.participantCount)}
              label="Candidats"
              hint={`${exam.outcomeCounts.passed} réussis · ${exam.outcomeCounts.pending} en attente`}
            />
            <KpiCell
              icon={Clock}
              value={exam.scheduledAt ? format(parseISO(exam.scheduledAt), 'd MMM · HH:mm', { locale: fr }) : '—'}
              label="Jour J"
              hint={formatExamDateTime(exam.scheduledAt)}
            />
            <KpiCell
              icon={MapPin}
              value={exam.venueRoom?.shortCode ?? exam.venueRoom?.name?.split(' ')[0] ?? '—'}
              label="Salle examen"
              hint={exam.venueRoom?.floorLabel ?? exam.session.location}
            />
            <KpiCell
              icon={CheckCircle2}
              value={`${exam.outcomeCounts.passed}/${exam.participantCount}`}
              label="Réussites"
              hint={`${exam.outcomeCounts.failed + exam.outcomeCounts.absent} non aboutis`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <FormationSessionVenueRoomSummary
          roomName={roomName}
          imageUrl={roomImage}
          layout="moyens"
        />
        <FormationSessionTrainerSummary
          trainerName={ctx?.trainerName ?? exam.session.trainer?.name ?? null}
          trainerEmail={ctx?.trainerEmail ?? exam.session.trainer?.email ?? null}
          trainerAvatar={ctx?.trainerAvatar ?? exam.session.trainer?.avatar ?? null}
        />
      </div>

      <Separator />
    </div>
  );
}
