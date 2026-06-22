'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MapPin, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';

export type FormationSessionOverviewMetricsProps = {
  /** Durée fiche formation (ne change pas selon la session). */
  durationDisplay: string;
  /** Nombre d'élèves inscrits sur cette session. */
  enrolledCount: number;
  /** Sous-titre optionnel (ex. capacité session 6–12). */
  capacityHint?: string | null;
  /** Salle réservée pour cette session. */
  roomName?: string | null;
  /** Formateur référent de la session. */
  trainer?: {
    name: string | null;
    email: string;
    avatar?: string | null;
  } | null;
};

export function FormationSessionOverviewMetrics({
  durationDisplay,
  enrolledCount,
  capacityHint,
  roomName,
  trainer,
}: FormationSessionOverviewMetricsProps) {
  const roomLabel = roomName?.trim() || 'Non renseignée';
  const hasTrainer = Boolean(trainer?.name?.trim() || trainer?.email?.trim());

  return (
    <Card className="mb-5 rounded-md bg-accent/70 p-1">
      <CardContent className="rounded-md border border-border bg-background p-0">
        <div className="grid md:grid-cols-4 lg:gap-5">
          {/* 1 — Durée (référence formation) */}
          <div className="flex flex-col justify-between gap-5 p-4.5 pb-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-semibold text-foreground lg:text-2xl">
                {durationDisplay?.trim() || '—'}
              </span>
              <span className="text-xs font-normal text-secondary-foreground/70">Nombre d&apos;heures</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="success" size="sm" appearance="light" className="w-fit">
                <TrendingUp className="size-3" /> Réf.
              </Badge>
              <span className="text-xs font-normal text-secondary-foreground">fiche formation</span>
            </div>
          </div>

          {/* 2 — Inscrits session */}
          <div className="flex flex-col justify-between gap-5 border-border p-4.5 pb-3.5 md:border-s">
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-semibold text-foreground lg:text-2xl">
                {enrolledCount}
                <span className="text-base font-medium text-secondary-foreground/50 lg:text-lg">
                  {' '}
                  inscrit{enrolledCount > 1 ? 's' : ''}
                </span>
              </span>
              <span className="text-xs font-normal text-secondary-foreground/70">Sur cette session</span>
              {capacityHint?.trim() ? (
                <span className="text-[11px] text-muted-foreground">{capacityHint}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="success" size="sm" appearance="light" className="w-fit">
                <Users className="size-3" /> Session
              </Badge>
              <span className="text-xs font-normal text-secondary-foreground">stagiaires</span>
            </div>
          </div>

          {/* 3 — Salle */}
          <div className="flex flex-col justify-between gap-5 border-border p-4.5 pb-3.5 md:border-s">
            <div className="flex min-h-[5.5rem] flex-col justify-center gap-1">
              <span
                className={`line-clamp-2 text-lg font-semibold leading-snug lg:text-xl ${
                  roomName?.trim() ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {roomLabel}
              </span>
              <span className="text-xs font-normal text-secondary-foreground/70">Salle réservée</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={roomName?.trim() ? 'success' : 'secondary'} size="sm" appearance="light" className="w-fit">
                <MapPin className="size-3" /> Moyens
              </Badge>
              <span className="text-xs font-normal text-secondary-foreground">planning</span>
            </div>
          </div>

          {/* 4 — Formateur (réservé au référent) */}
          <div className="flex flex-col justify-between gap-5 border-border p-4.5 pb-3.5 md:border-s">
            {hasTrainer ? (
              <>
                <div className="flex min-h-[8.5rem] flex-1 flex-col items-center justify-center gap-2">
                  <SessionUserAvatar
                    name={trainer!.name}
                    email={trainer!.email}
                    avatar={trainer!.avatar}
                    square
                    sizeClassName="size-24 shrink-0"
                  />
                  <span className="line-clamp-2 w-full text-center text-xs font-semibold leading-snug text-foreground">
                    {trainer!.name?.trim() || trainer!.email}
                  </span>
                  <span className="w-full text-center text-xs font-normal text-secondary-foreground/70">
                    Formateur référent
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <Badge variant="success" size="sm" appearance="light" className="w-fit">
                    <TrendingUp className="size-3" /> Réf.
                  </Badge>
                  <span className="text-xs font-normal text-secondary-foreground">session</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex min-h-[8.5rem] flex-1 flex-col items-center justify-center gap-2 text-center">
                  <div className="flex size-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                    —
                  </div>
                  <span className="text-xs font-normal text-secondary-foreground/70">Formateur référent</span>
                  <span className="text-[11px] text-muted-foreground">À choisir dans l&apos;onglet Moyens</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <Badge variant="secondary" size="sm" appearance="light" className="w-fit">
                    Non assigné
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
