'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Building2, GraduationCap } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardFooter } from '@repo/ui/card';
import type { CrmDashboardPayload } from '@/lib/crm/crm-dashboard-types';
import { formatPortalDate } from '@/lib/portal/format-portal-date';

type CrmWelcomeCalloutProps = {
  displayName: string;
  roleLabel: string;
  stats: CrmDashboardPayload['stats'];
  nextSession: CrmDashboardPayload['nextSession'];
};

export function CrmWelcomeCallout({
  displayName,
  roleLabel,
  stats,
  nextSession,
}: CrmWelcomeCalloutProps) {
  return (
    <Fragment>
      <style>
        {`
          .Crm-callout-bg {
            background-image: url('${toAbsoluteUrl('/images/bg-2.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="Crm-callout-bg bg-cover bg-center bg-no-repeat p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Building2 className="size-8 text-primary" />
              </div>
              <span className="rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-2xs font-semibold uppercase tracking-wide text-primary">
                {roleLabel}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Bonjour, <span className="text-primary">{displayName}</span>
            </h2>
            <p className="text-sm font-normal leading-5.5 text-secondary-foreground">
              {stats.collaboratorsActive} collaborateur{stats.collaboratorsActive > 1 ? 's' : ''} ·{' '}
              {stats.traineesActive} stagiaire{stats.traineesActive > 1 ? 's' : ''} · {stats.leadsNew}{' '}
              lead{stats.leadsNew > 1 ? 's' : ''} ce mois.
            </p>
            {nextSession ? (
              <div className="rounded-lg border border-primary/20 bg-background/70 p-3 backdrop-blur-sm">
                <p className="text-2xs font-bold uppercase tracking-wider text-primary">
                  Prochaine session
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <GraduationCap className="size-4 text-primary" />
                  {nextSession.formationName}
                </p>
                {nextSession.startDate ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPortalDate(nextSession.startDate)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t border-border px-8 py-4">
          <Button size="sm" variant="outline" asChild>
            <Link href="/gestion-academique/vie-scolaire/sessions">Sessions</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/gestion-academique/vie-scolaire/etudiants">Candidatures</Link>
          </Button>
          {nextSession ? (
            <Button size="sm" asChild>
              <Link href={nextSession.href}>Voir la session</Link>
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </Fragment>
  );
}
