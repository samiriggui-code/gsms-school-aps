'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, LayoutDashboard, Workflow } from 'lucide-react';

export function DocsCircuitsWelcomeCallout() {
  return (
    <Fragment>
      <style>
        {`
          .docs-circuits-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .docs-circuits-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat docs-circuits-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <LayoutDashboard className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Module <span className="text-primary">Suivi formations</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Tableau de suivi session, enquêtes satisfaction HOT/COLD (J0 / J+45) et historique des
              circuits n8n. Le classeur Qualiopi reste sous Gestion ressources.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/suivi-formations/tableau">
              <LayoutDashboard className="size-4 mr-1" />
              Tableau de suivi
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/suivi-formations/satisfaction">
              <ClipboardList className="size-4 mr-1" />
              Satisfaction
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/suivi-formations/circuits">
              <Workflow className="size-4 mr-1" />
              Circuits
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
