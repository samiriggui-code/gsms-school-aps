'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MODULE_LANDING_TABLE_CARD_CLASS } from '@/components/common/module-landing-panel-styles';

/** Rangée 3 — lien vers feuille Historique (AiRun) tant que le DataGrid n’est pas branché. */
export function IaHistoriquePanel() {
  return (
    <Card className={MODULE_LANDING_TABLE_CARD_CLASS}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed py-3.5">
        <CardTitle className="text-base font-bold uppercase text-foreground">
          Historique des runs
        </CardTitle>
        <Badge variant="secondary">AiRun</Badge>
      </CardHeader>
      <CardContent className="flex min-h-[160px] flex-col justify-between gap-4 p-5">
        <p className="text-sm text-secondary-foreground">
          Journal des exécutions IA (succès / échec, provider, modèle). Feuille dédiée prête dans
          l&apos;arbre menu — DataGrid à brancher sur AiRun.
        </p>
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/pilotage-supervision/ia/historique">
            <History className="mr-1 size-4" />
            Ouvrir l&apos;historique
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
