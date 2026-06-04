'use client';

import Link from 'next/link';
import { PilotageWorkspacePage } from '@/components/workspace/pilotage-workspace-page';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import type { ModuleWorkspaceViewKey } from '@repo/api-core';

type Props = {
  viewKey: ModuleWorkspaceViewKey;
};

export function PilotageAlertsPage({ viewKey }: Props) {
  return (
    <>
      <Container className="pb-0">
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-border/70 bg-muted/20 p-3">
          <span className="text-xs text-muted-foreground me-2 self-center">Accès rapides :</span>
          <Button size="sm" variant="outline" asChild>
            <Link href="/gestion-academique/vie-scolaire/etudiants">Vie scolaire</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/administration-facturation/finance/devis">Finance devis</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/gestion-ressources/equipements/inventaire">Équipements</Link>
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/pilotage-supervision/pilotage/rapports">
              Rapports & exports
              <ExternalLink className="ms-1 size-3" />
            </Link>
          </Button>
        </div>
      </Container>
      <PilotageWorkspacePage viewKey={viewKey} />
    </>
  );
}
