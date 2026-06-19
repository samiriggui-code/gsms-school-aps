'use client';

import { User as Collaborateur } from '@/app/models/user';
import { CollaborateurComplianceDatagrid } from './collaborateur-compliance-datagrid';

export function CollaborateurDetailsCompliance({
  collaborateur,
  trainerContext = false,
}: {
  collaborateur: Collaborateur;
  trainerContext?: boolean;
}) {
  const displayName =
    [collaborateur.firstName, collaborateur.lastName].filter(Boolean).join(' ') ||
    collaborateur.email ||
    '';

  return (
    <CollaborateurComplianceDatagrid
      userId={collaborateur.id}
      displayName={displayName}
      trainerContext={trainerContext}
    />
  );
}
