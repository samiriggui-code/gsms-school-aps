'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { COMPANY_PROFILE_SETTINGS_HREF } from '@/lib/company-profile';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Card, CardContent, CardFooter } from '@repo/ui/card';
import { Building, FolderOpen, Network } from 'lucide-react';
import { Button } from '@repo/ui/button';

export function CompagnieWelcomeCallout() {
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

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat rh-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building className="w-8 h-8 text-primary" />
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
              Module <span className="text-primary">Compagnie</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Consultez le profil de la compagnie et ses indicateurs.{' '}
              <Link href={COMPANY_PROFILE_SETTINGS_HREF} className="text-primary underline underline-offset-4">
                Modifier le profil
              </Link>{' '}
              dans Paramètres système.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/compagnie/profil">
              <Building className="size-4 mr-1" />
              Profil
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/compagnie/structure">
              <Network className="size-4 mr-1" />
              Structure
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/compagnie/documents">
              <FolderOpen className="size-4 mr-1" />
              Documents
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
