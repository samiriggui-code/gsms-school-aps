'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  Users,
} from 'lucide-react';

export function VieScolaireWelcomeCallout() {
  return (
    <Fragment>
      <style>
        {`
          .VieScolaire-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .VieScolaire-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat VieScolaire-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div className="flex -space-x-2.5">
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-1.png')} />
                  <AvatarFallback>1</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} />
                  <AvatarFallback>2</AvatarFallback>
                </Avatar>
                <Avatar className="size-10">
                  <AvatarImage src={toAbsoluteUrl('/media/avatars/300-3.png')} />
                  <AvatarFallback>3</AvatarFallback>
                </Avatar>
                <Avatar className="size-10 ring-2 ring-background bg-primary text-white text-xs">
                  <AvatarFallback>+12</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Module <span className="text-primary">Vie scolaire</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Catalogue, sessions, planning, candidatures puis suivi de parcours par session.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-academique/vie-scolaire/formations">
              <BookOpen className="size-4 shrink-0" />
              Formations
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-academique/vie-scolaire/sessions">
              <CalendarDays className="size-4 shrink-0" />
              Sessions
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-academique/vie-scolaire/planning">
              <CalendarRange className="size-4 shrink-0" />
              Planning
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-academique/vie-scolaire/etudiants">
              <Users className="size-4 shrink-0" />
              Étudiants
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="min-w-0 shrink" asChild>
            <Link href="/gestion-academique/vie-scolaire/suivi-formations">
              <ClipboardList className="size-4 shrink-0" />
              Suivi formations
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
