'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ExternalLink, MapPin, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { FormationSessionApiRow } from '../types/formation-session-api-row';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';
import { FormationLogoThumb } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/formation-logo-thumb';
import { FORMATION_PARCOURS_LABELS } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import {
  EXAMEN_FINAL_BADGE_LABEL,
  formationParcoursHasExamenFinal,
} from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';

function cardHighlightBadge(row: FormationSessionApiRow): {
  label: string;
  variant: ComponentProps<typeof Badge>['variant'];
} {
  if (formationParcoursHasExamenFinal(row.formationParcours)) {
    return { label: EXAMEN_FINAL_BADGE_LABEL, variant: 'success' };
  }
  return { label: FORMATION_PARCOURS_LABELS[row.formationParcours], variant: 'outline' };
}

function sessionSubtitle(row: FormationSessionApiRow): string {
  const s = row.sessionSubtitle?.trim();
  return s ?? row.formationName;
}

function manageHref(slug: string, sessionId: string): string {
  const q = new URLSearchParams();
  q.set('sessionId', sessionId);
  q.set('formationSlug', slug);
  return `/gestion-academique/vie-scolaire/sessions?${q.toString()}`;
}

export function SessionsByFormation({ formationSlug }: { formationSlug: string | null }) {
  const slug = formationSlug?.trim() ?? '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['gestion-academique', 'vie-scolaire', 'sessions', 'by-formation', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<FormationSessionApiRow[]> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions?formationSlug=${encodeURIComponent(slug)}`,
      );
      if (!res.ok) throw new Error('Sessions indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse invalide.');
      return j.data.items as FormationSessionApiRow[];
    },
    staleTime: 20_000,
  });

  if (!slug) {
    return (
      <p className="text-sm text-muted-foreground">
        Ouvrez une formation catalogue pour voir ses sessions planifiées.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des sessions…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  }

  const upcoming = (data ?? []).filter((row) => !row.isExpired);

  if (!upcoming.length) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          {data?.length
            ? 'Aucune session à venir — les sessions passées sont masquées ici (comme sur le landing).'
            : 'Aucune session créée pour cette formation au catalogue.'}
        </p>
        <p>
          <Link
            href={`/gestion-academique/vie-scolaire/sessions?formationSlug=${encodeURIComponent(slug)}`}
            className="font-medium text-primary underline-offset-4 hover:underline inline-flex items-center gap-1"
          >
            Vie scolaire → Sessions
            <ExternalLink className="size-3.5" />
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {upcoming.map((row) => {
        const kind = cardHighlightBadge(row);
        return (
          <Card
            key={row.id}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-none"
          >
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3 border-b border-border pb-3">
                <FormationLogoThumb
                  name={row.formationName}
                  slug={row.formationSlug}
                  logoUrl={row.formationVitrineOverview?.logoUrl}
                  className="size-14 shrink-0 rounded-xl"
                  imageClassName="object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Formation
                  </p>
                  <p className="text-sm font-semibold leading-tight text-foreground">{row.formationName}</p>
                  {row.trainerName || row.trainerEmail ? (
                    <p className="text-[11px] text-muted-foreground">
                      Formateur · {row.trainerName?.trim() || row.trainerEmail}
                    </p>
                  ) : null}
                </div>
              </div>
              {row.participants.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/80 px-2 py-1.5">
                    <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="flex -space-x-1.5">
                      {row.participants.slice(0, 4).map((p) => (
                        <SessionUserAvatar
                          key={p.userId}
                          name={p.name}
                          email={p.email}
                          avatar={p.avatar}
                          sizeClassName="size-7 ring-2 ring-card"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      {row.participants.length}
                    </span>
                  </div>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate font-medium">{row.location}</span>
                </div>
                <Badge variant={kind.variant} appearance="light" size="sm" className="shrink-0">
                  {kind.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-stretch gap-3 sm:flex-nowrap">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted"
                  aria-hidden
                >
                  <CalendarDays className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {row.dateDisplayLabel}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{sessionSubtitle(row)}</p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 w-full shrink-0 sm:mt-0 sm:w-auto sm:self-center"
                >
                  <Link href={manageHref(slug, row.id)} className="gap-1.5">
                    Gérer
                    <ExternalLink className="size-3.5 opacity-70" aria-hidden />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
