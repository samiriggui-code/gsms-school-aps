'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent, CardFooter } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { FolderOpen, History, ShieldCheck } from 'lucide-react';

export function QualiopiWelcomeCallout() {
  return (
    <Fragment>
      <style>
        {`
          .qualiopi-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-4.png')}');
          }
          .dark .qualiopi-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-4-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat qualiopi-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Module <span className="text-primary">Qualiopi</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Classeur des 32 indicateurs du référentiel V.9 : statut d&apos;audit (OK / KO / à
              réparer / N/A) et preuve associée, plus historique des écarts (OF-11).
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/qualiopi/classeur">
              <FolderOpen className="size-4 mr-1" />
              Ouvrir le classeur
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/qualiopi/historique">
              <History className="size-4 mr-1" />
              Historique
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
