'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, Wallet, CreditCard } from 'lucide-react';

export function SubscriptionWelcomeCallout() {
  return (
    <Fragment>
      <style>
        {`
          .welcome-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .welcome-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat welcome-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <AvatarGroup
                size="size-10"
                group={[
                  { filename: '300-7.png' },
                  { filename: '300-8.png' },
                  { filename: '300-9.png' },
                  {
                    fallback: '+47',
                    variant: 'text-white text-xs ring-background bg-primary'
                  }
                ]}
              />
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Module <span className="text-primary">RH</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              GÃ©rez vos collaborateurs, formations, <br />
              absences et paie, suivez les cartes <br />
              professionnelles et vÃ©rifications.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/rh/collaborateurs">
              <Users className="size-4 mr-1" />
              Collaborateurs
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/rh/formations">
              <GraduationCap className="size-4 mr-1" />
              Formations
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/rh/paie">
              <Wallet className="size-4 mr-1" />
              Paie
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/rh/cartes">
              <CreditCard className="size-4 mr-1" />
              Cartes
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
