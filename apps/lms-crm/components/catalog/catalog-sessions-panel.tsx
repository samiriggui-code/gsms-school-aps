'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Calendar, MapPin, Users, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export type CatalogSessionRow = {
  id: string;
  dateDisplayLabel: string;
  location: string;
  registrationClosesAt: string | null;
  traineesMax: number | null;
  traineesMin: number | null;
  sessionKind: string;
  sessionSubtitle: string | null;
  enrolledConfirmed: number;
  pipelineInterested: number;
  isFull: boolean;
  registrationClosed: boolean;
};

type CatalogSessionsPayload = {
  formation: { id: string; name: string; slug: string } | null;
  sessions: CatalogSessionRow[];
  catalogInactive?: boolean;
};

function sessionKindBadge(
  sessionSubtitle: string | null,
  sessionKind: string,
  labels: { withExam: string; initial: string; generic: string },
) {
  if (sessionSubtitle?.trim()) return sessionSubtitle.trim();
  if (sessionKind === 'WITH_EXAM') return labels.withExam;
  if (sessionKind === 'INITIAL') return labels.initial;
  return labels.generic;
}

function formatCloseDate(iso: string | null, locale: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

function PlacesLine({
  row,
  labels,
}: {
  row: CatalogSessionRow;
  labels: {
    enrolledFormat: string;
    seatsLeftFormat: string;
    seatsLeftFormatPlural: string;
    confirmedOnlySingular: string;
    confirmedOnlyPlural: string;
    pipelineSingular: string;
    pipelinePlural: string;
  };
}) {
  const max = row.traineesMax;
  const n = row.enrolledConfirmed;
  const pipe = row.pipelineInterested;

  let main: string;
  if (max != null && max > 0) {
    main = labels.enrolledFormat
      .replace('{{enrolled}}', String(n))
      .replace('{{max}}', String(max));
    const left = max - n;
    if (left > 0 && !row.isFull && !row.registrationClosed) {
      main +=
        left > 1
          ? ` ${labels.seatsLeftFormatPlural.replace('{{left}}', String(left))}`
          : ` ${labels.seatsLeftFormat.replace('{{left}}', String(left))}`;
    }
  } else {
    main =
      n > 1
        ? labels.confirmedOnlyPlural.replace('{{count}}', String(n))
        : labels.confirmedOnlySingular.replace('{{count}}', String(n));
  }

  return (
    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Users className="size-3 shrink-0" />
        {main}
      </span>
      {pipe > 0 ? (
        <span className="ps-4 text-[11px]">
          {pipe > 1
            ? labels.pipelinePlural.replace('{{count}}', String(pipe))
            : labels.pipelineSingular.replace('{{count}}', String(pipe))}
        </span>
      ) : null}
    </div>
  );
}

function SessionStatusBadge({
  row,
  labels,
}: {
  row: CatalogSessionRow;
  labels: { full: string; registrationsClosed: string; registrationsOpen: string };
}) {
  if (row.isFull) {
    return (
      <Badge variant="destructive" appearance="light" size="sm">
        {labels.full}
      </Badge>
    );
  }
  if (row.registrationClosed) {
    return (
      <Badge variant="warning" appearance="light" size="sm">
        {labels.registrationsClosed}
      </Badge>
    );
  }
  return (
    <Badge variant="success" appearance="light" size="sm">
      {labels.registrationsOpen}
    </Badge>
  );
}

type CatalogSessionsPanelProps = {
  formationSlug: string;
  layout?: 'compact' | 'grid';
  formationSubtitle?: string;
  emptyTitle?: string;
  emptyHint?: string;
  className?: string;
};

export function CatalogSessionsPanel({
  formationSlug,
  layout = 'compact',
  formationSubtitle,
  emptyTitle,
  emptyHint,
  className,
}: CatalogSessionsPanelProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n?.language?.startsWith('fr') ? 'fr-FR' : 'en-US';
  const labels = {
    withExam: t('landing.sheetContent.common.catalogSessions.withExam'),
    initial: t('landing.sheetContent.common.catalogSessions.initial'),
    genericSession: t('landing.sheetContent.common.catalogSessions.genericSession'),
    enrolledFormat: t('landing.sheetContent.common.catalogSessions.enrolledFormat'),
    seatsLeftFormat: t('landing.sheetContent.common.catalogSessions.seatsLeftFormat'),
    seatsLeftFormatPlural: t('landing.sheetContent.common.catalogSessions.seatsLeftFormatPlural'),
    confirmedOnlySingular: t('landing.sheetContent.common.catalogSessions.confirmedOnlySingular'),
    confirmedOnlyPlural: t('landing.sheetContent.common.catalogSessions.confirmedOnlyPlural'),
    pipelineSingular: t('landing.sheetContent.common.catalogSessions.pipelineSingular'),
    pipelinePlural: t('landing.sheetContent.common.catalogSessions.pipelinePlural'),
    full: t('landing.sheetContent.common.catalogSessions.full'),
    registrationsClosed: t('landing.sheetContent.common.catalogSessions.registrationsClosed'),
    registrationsOpen: t('landing.sheetContent.common.catalogSessions.registrationsOpen'),
    loadError: t('landing.sheetContent.common.catalogSessions.loadError'),
    networkError: t('landing.sheetContent.common.catalogSessions.networkError'),
    loading: t('landing.sheetContent.common.catalogSessions.loading'),
    emptyTitle:
      emptyTitle ?? t('landing.sheetContent.common.catalogSessions.emptyTitle'),
    emptyHint:
      emptyHint ?? t('landing.sheetContent.common.catalogSessions.emptyHint'),
    expectedSlug: t('landing.sheetContent.common.catalogSessions.expectedSlug'),
    catalogInactiveTitle: t('landing.sheetContent.common.catalogSessions.catalogInactiveTitle'),
    catalogInactiveHint: t('landing.sheetContent.common.catalogSessions.catalogInactiveHint'),
    closingLabel: t('landing.sheetContent.common.catalogSessions.closingLabel'),
    closingLabelCompact: t('landing.sheetContent.common.catalogSessions.closingLabelCompact'),
    closedSuffix: t('landing.sheetContent.common.catalogSessions.closedSuffix'),
    preRegistrationHint: t('landing.sheetContent.common.catalogSessions.preRegistrationHint'),
    preRegistrationButton: t('landing.sheetContent.common.catalogSessions.preRegistrationButton'),
    preRegistrationFooter: t('landing.sheetContent.common.catalogSessions.preRegistrationFooter'),
  };

  const [payload, setPayload] = useState<CatalogSessionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/catalog/sessions?slug=${encodeURIComponent(formationSlug)}`,
          { cache: 'no-store' },
        );
        const json = (await res.json()) as CatalogSessionsPayload & { message?: string };
        if (!res.ok) {
          throw new Error(json.message ?? labels.loadError);
        }
        if (!cancelled) setPayload(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : labels.networkError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formationSlug, labels.loadError, labels.networkError]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center gap-2 py-16 text-muted-foreground', className)}>
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">{labels.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-10 text-center',
          className,
        )}
      >
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">{error}</p>
      </div>
    );
  }

  if (!payload?.formation) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-accent/10 px-4 py-12 text-center',
          className,
        )}
      >
        <Calendar className="size-10 text-muted-foreground opacity-30" />
        <p className="text-sm font-medium text-foreground">{labels.emptyTitle}</p>
        <p className="max-w-md text-xs text-muted-foreground">{labels.emptyHint}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {labels.expectedSlug} <span className="font-mono">{formationSlug}</span>
        </p>
      </div>
    );
  }

  if (payload.catalogInactive) {
    return (
      <div className={cn('rounded-md border border-dashed bg-accent/10 px-4 py-10 text-center', className)}>
        <p className="text-sm font-medium text-foreground">{labels.catalogInactiveTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{labels.catalogInactiveHint}</p>
      </div>
    );
  }

  if (payload.sessions.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-accent/10 px-4 py-12 text-center',
          className,
        )}
      >
        <Calendar className="size-10 text-muted-foreground opacity-30" />
        <p className="text-sm font-medium text-foreground">{labels.emptyTitle}</p>
        <p className="max-w-md text-xs text-muted-foreground">{labels.emptyHint}</p>
      </div>
    );
  }

  const sub = formationSubtitle ?? payload.formation.name;

  if (layout === 'grid') {
    return (
      <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}>
        {payload.sessions.map((session) => (
          <Card key={session.id} className="border border-border bg-accent/30 shadow-none">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <SessionStatusBadge row={session} labels={labels} />
                  <PlacesLine row={session} labels={labels} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center text-sm font-semibold text-foreground">
                    <Calendar className="mr-2 size-4 shrink-0 text-primary" />
                    {session.dateDisplayLabel}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    {session.location}
                  </div>
                  {session.registrationClosesAt && (
                    <p className="text-[11px] text-muted-foreground">
                      {labels.closingLabel} {formatCloseDate(session.registrationClosesAt, locale)}
                      {session.registrationClosed ? ` ${labels.closedSuffix}` : ''}
                    </p>
                  )}
                  <Badge variant="outline" size="sm" appearance="light" className="w-fit">
                    {sessionKindBadge(session.sessionSubtitle, session.sessionKind, {
                      withExam: labels.withExam,
                      initial: labels.initial,
                      generic: labels.genericSession,
                    })}
                  </Badge>
                </div>
              </div>
              <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                {labels.preRegistrationHint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  /* compact layout — même grille scrollable que les anciennes cartes dates */
  return (
    <div className={cn('grid h-[400px] gap-5 overflow-auto pr-2 lg:grid-cols-2', className)}>
      {payload.sessions.map((session) => (
        <Card key={session.id} className="rounded-md border border-border bg-accent/50 shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-col gap-0.5 rounded-t-md border-b border-input bg-accent/30 py-3 ps-4">
              <div className="flex flex-wrap items-center gap-2 pe-4">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{session.location}</span>
                <div className="ms-auto flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <SessionStatusBadge row={session} labels={labels} />
                  <Badge variant="outline" size="sm" appearance="light">
                    {sessionKindBadge(session.sessionSubtitle, session.sessionKind, {
                      withExam: labels.withExam,
                      initial: labels.initial,
                      generic: labels.genericSession,
                    })}
                  </Badge>
                </div>
              </div>
              <div className="px-4 pb-1">
                <PlacesLine row={session} labels={labels} />
              </div>
            </div>
            <div className="m-1 mt-0 flex flex-col gap-2 rounded-b-md bg-background p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent/50">
                  <Calendar className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight text-foreground">
                    {session.dateDisplayLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">{sub}</span>
                  {session.registrationClosesAt ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {labels.closingLabelCompact} {formatCloseDate(session.registrationClosesAt, locale)}
                    </span>
                  ) : null}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full shrink-0" disabled>
                {labels.preRegistrationButton}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                {labels.preRegistrationFooter}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
