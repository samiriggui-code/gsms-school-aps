'use client';

import { User as Etudiant } from '@/app/models/user';
import { EtudiantDetailsPermissions } from './etudiant-details-permissions';
import { EtudiantPlatformAccessPanel } from './etudiant-platform-access-panel';
import type { LmsAccessTier } from '@/lib/portal/lms-access-shared';

export function EtudiantAccesTab({
  etudiant,
  lmsAccessTier,
  dossierLabel,
}: {
  etudiant: Etudiant;
  lmsAccessTier: LmsAccessTier;
  dossierLabel?: string | null;
}) {
  return (
    <div className="space-y-6 pb-4">
      <EtudiantPlatformAccessPanel
        etudiant={etudiant}
        lmsAccessTier={lmsAccessTier}
        dossierLabel={dossierLabel}
      />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rôle CRM &amp; permissions héritées
        </p>
        <EtudiantDetailsPermissions Etudiant={etudiant} lmsAccessTier={lmsAccessTier} />
      </div>
    </div>
  );
}
