'use client';

import { GovernanceHubPage } from '@/components/governance/governance-hub-page';

export default function Page() {
  return (
    <GovernanceHubPage
      workspaceKey="gouvernance-storage"
      apiPath="/api/sections/securite-configuration/gouvernance-donnees/storage"
      queryKey="gouvernance-storage"
      statLabels={[
        { key: 'total', label: 'Fichiers actifs', subtitle: 'FileAsset' },
        { key: 'sizeMb', label: 'Volume (Mo)', subtitle: 'Stockage' },
        { key: 'modules', label: 'Modules', subtitle: 'Page courante' },
        { key: 'avgSizeKb', label: 'Taille moyenne', subtitle: 'Ko / fichier' },
        { key: 'entityTypes', label: 'Entités', subtitle: 'Types liés' },
      ]}
      columns={[
        { key: 'originalName', label: 'Fichier' },
        { key: 'module', label: 'Module' },
        { key: 'entityType', label: 'Entité' },
        { key: 'sizeLabel', label: 'Taille', align: 'right' },
      ]}
    />
  );
}
