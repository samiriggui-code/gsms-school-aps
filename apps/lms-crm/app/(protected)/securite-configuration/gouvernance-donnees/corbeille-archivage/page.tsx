'use client';

import { GovernanceHubPage } from '@/components/governance/governance-hub-page';

export default function Page() {
  return (
    <GovernanceHubPage
      workspaceKey="gouvernance-corbeille"
      apiPath="/api/sections/securite-configuration/gouvernance-donnees/corbeille"
      queryKey="gouvernance-corbeille"
      canRestore
      statLabels={[
        { key: 'total', label: 'Fichiers supprimés', subtitle: 'Corbeille' },
        { key: 'trashedUsers', label: 'Comptes corbeille', subtitle: 'Utilisateurs' },
        { key: 'volumeTotal', label: 'Volume total', subtitle: 'Éléments archivés' },
        { key: 'retentionDays', label: 'Rétention', subtitle: 'Jours (politique)' },
        { key: 'restoreCount', label: 'Restaurations', subtitle: 'Action admin' },
      ]}
      columns={[
        { key: 'originalName', label: 'Fichier' },
        { key: 'module', label: 'Module' },
        { key: 'deletedAt', label: 'Supprimé le', align: 'right' },
      ]}
    />
  );
}
