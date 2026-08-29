'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Bot, FileWarning, History } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function IaWelcomeCallout() {
  return (
    <Fragment>
      <style>
        {`
          .ia-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-4.png')}');
          }
          .dark .ia-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-4-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full">
        <CardContent className="p-8 bg-cover bg-center bg-no-repeat ia-callout-bg">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <Badge variant="warning">GSMS-AI-01 / AI-02</Badge>
            </div>
            <h2 className="text-2xl font-semibold text-mono">
              Module <span className="text-primary">IA</span>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Revue humaine des artefacts (AiArtifact) et journal des exécutions (AiRun). Rien
              n&apos;est écrit en base métier sans validation — le générateur programme modules est
              déjà branché sur les formations.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-start">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pilotage-supervision/ia/brouillons">
              <FileWarning className="size-4 mr-1" />
              Brouillons à valider
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pilotage-supervision/ia/historique">
              <History className="size-4 mr-1" />
              Historique
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
