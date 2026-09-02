'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { MODULE_LANDING_TABLE_CARD_CLASS } from '@/components/common/module-landing-panel-styles';

/** Rangée 3 — lien vers feuille Historique (OF-11) tant que la timeline n’est pas branchée. */
export function QualiopiHistoriquePanel() {
  return (
    <Card className={MODULE_LANDING_TABLE_CARD_CLASS}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed py-3.5">
        <CardTitle className="text-base font-bold uppercase text-foreground">
          Historique / écarts
        </CardTitle>
        <Badge variant="warning">OF-11</Badge>
      </CardHeader>
      <CardContent className="flex min-h-[160px] flex-col justify-between gap-4 p-5">
        <p className="text-sm text-secondary-foreground">
          Timeline des non-conformités (ComplianceItemEvent) : passages OK→KO, preuves rejetées,
          commentaires d&apos;audit. Feuille dédiée prête dans l&apos;arbre menu.
        </p>
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/gestion-ressources/qualiopi/historique">
            <History className="mr-1 size-4" />
            Ouvrir l&apos;historique
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
