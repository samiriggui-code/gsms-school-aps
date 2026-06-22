'use client';

import { User as Collaborateur } from '@/app/models/user';
import { CollaborateurDetailsOverview } from '../../collaborateurs/components/collaborateur-details-overview';

/** Délègue à la vue d’ensemble unifiée (évite les écarts collaborateur / formateur). */
export function FormateurDetailsOverview({ collaborateur }: { collaborateur: Collaborateur }) {
  return (
    <CollaborateurDetailsOverview
      collaborateur={collaborateur}
      overviewVariant="formateur"
    />
  );
}
