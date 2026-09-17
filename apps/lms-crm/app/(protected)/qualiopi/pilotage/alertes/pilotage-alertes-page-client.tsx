'use client';

import Link from 'next/link';
import { QualiopiAlerts } from '@/app/(protected)/qualiopi/referentiel/components/qualiopi-alerts';
import { QualiopiGapsAssistantPanel } from '@/app/(protected)/qualiopi/referentiel/components/qualiopi-gaps-assistant-panel';
import { Button } from '@repo/ui/button';

/** File unique Pilotage — écarts Qualiopi (moteur) en tête. */
export function PilotageAlertesPageClient() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Une seule file : ce que le moteur Qualiopi détecte (KO, preuves manquantes,
          gaps). Les correctifs se font dans le métier (classeur, partenaires, sessions).
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/qualiopi/referentiel/ecarts">Ouvrir les écarts détectés</Link>
        </Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
        <QualiopiAlerts />
        <QualiopiGapsAssistantPanel />
      </div>
    </div>
  );
}
