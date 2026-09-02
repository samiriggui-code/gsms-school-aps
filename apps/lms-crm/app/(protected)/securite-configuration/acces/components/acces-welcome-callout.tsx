'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Card, CardContent, CardFooter } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { KeyRound, ShieldCheck, ShieldUser, UserCog } from 'lucide-react';

export function AccesWelcomeCallout() {
  return (
    <Fragment>
      <style>
        {`
          .rh-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .rh-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full min-w-0 w-full overflow-hidden">
        <CardContent className="p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-no-repeat rh-callout-bg">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <div className="flex min-w-0 -space-x-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            <h2 className="text-xl font-semibold text-mono sm:text-2xl">
              Module <span className="text-primary">Acces</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-relaxed">
              Gère les utilisateurs, rôles et permissions avec traçabilité des accès en temps réel.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/acces/users">
              <UserCog className="size-4 mr-1" />
              Utilisateurs
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/acces/roles">
              <ShieldUser className="size-4 mr-1" />
              Roles
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/acces/permissions">
              <ShieldCheck className="size-4 mr-1" />
              Permissions
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/acces/logs">
              <KeyRound className="size-4 mr-1" />
              Logs
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
