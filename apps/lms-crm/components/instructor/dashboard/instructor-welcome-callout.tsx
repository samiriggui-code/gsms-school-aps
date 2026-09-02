'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Megaphone,
  Users,
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardFooter } from '@repo/ui/card';
import type { InstructorDashboardPayload } from '@/lib/instructor/instructor-types';
import { formatPortalDate } from '@/lib/portal/format-portal-date';

type InstructorWelcomeCalloutProps = {
  displayName: string;
  stats: InstructorDashboardPayload['stats'];
  nextSession: InstructorDashboardPayload['nextSession'];
};

export function InstructorWelcomeCallout({
  displayName,
  stats,
  nextSession,
}: InstructorWelcomeCalloutProps) {
  return (
    <Fragment>
      <style>
        {`
          .Instructor-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .Instructor-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="Instructor-callout-bg bg-cover bg-center bg-no-repeat p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <GraduationCap className="size-8 text-primary" />
              </div>
              <div className="flex -space-x-2.5">
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-4.png')} />
                  <AvatarFallback>F1</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-5.png')} />
                  <AvatarFallback>F2</AvatarFallback>
                </Avatar>
                <Avatar className="size-10 ring-2 ring-background bg-primary text-xs text-white">
                  <AvatarFallback>+{Math.max(stats.traineeCount, 0)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Bonjour, <span className="text-primary">{displayName}</span>
            </h2>
            <p className="text-sm font-normal leading-5.5 text-secondary-foreground">
              {stats.formationCount} formation{stats.formationCount > 1 ? 's' : ''} assignée
              {stats.formationCount > 1 ? 's' : ''} · {stats.sessionCount} session
              {stats.sessionCount > 1 ? 's' : ''} · {stats.traineeCount} stagiaire
              {stats.traineeCount > 1 ? 's' : ''} sous votre responsabilité.
            </p>
            {nextSession ? (
              <div className="rounded-lg border border-primary/20 bg-background/70 p-3 backdrop-blur-sm">
                <p className="text-2xs font-bold uppercase tracking-wider text-primary">
                  Prochaine session
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {nextSession.formation.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextSession.dateDisplayLabel}
                  {nextSession.startDate
                    ? ` · ${formatPortalDate(nextSession.startDate)}`
                    : ''}
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-start gap-2">
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/formateur/formations">
              <GraduationCap className="size-4 shrink-0" />
              Formations
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/formateur/sessions">
              <CalendarDays className="size-4 shrink-0" />
              Sessions
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/formateur/stagiaires">
              <Users className="size-4 shrink-0" />
              Stagiaires
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/formateur/parcours">
              <BookOpen className="size-4 shrink-0" />
              Parcours LMS
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/formateur/annonces">
              <Megaphone className="size-4 shrink-0" />
              Annonces
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
