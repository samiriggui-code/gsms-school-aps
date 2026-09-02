'use client';

import { Megaphone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert';

export function CampagnesScopeCallout() {
  return (
    <Alert>
      <Megaphone className="size-4" />
      <AlertTitle>Campagnes acquisition (UTM)</AlertTitle>
      <AlertDescription>
        Cet écran sert à nommer et suivre les campagnes marketing (canal, UTM, statut
        brouillon/actif) — pas à envoyer des e-mails ou newsletters. Les leads entrants sont dans{' '}
        <strong>Formulaires leads</strong> ; les stats globales dans le hub Marketing.
      </AlertDescription>
    </Alert>
  );
}
