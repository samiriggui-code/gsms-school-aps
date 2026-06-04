'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, Database, FileSearch, Files } from 'lucide-react';

export function GouvernanceWelcomeCallout() {
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
                <Database className="w-8 h-8 text-primary" />
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
              Module <span className="text-primary">Gouvernance des donnees</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-relaxed">
              Pilote le storage, les demandes documentaires et le suivi d&apos;audit des contenus.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/storage-conformite">
              <Database className="size-4 mr-1" />
              Storage
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/demandes-documents">
              <Files className="size-4 mr-1" />
              Demandes
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/corbeille-archivage">
              <Archive className="size-4 mr-1" />
              Archivage
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/audit-documentaire">
              <FileSearch className="size-4 mr-1" />
              Audit
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
