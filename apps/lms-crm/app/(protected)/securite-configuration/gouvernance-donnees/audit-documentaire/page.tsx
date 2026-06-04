'use client';

import { GovernanceHubPage } from '@/components/governance/governance-hub-page';

export default function Page() {
  return (
    <GovernanceHubPage
      workspaceKey="gouvernance-audit"
      apiPath="/api/sections/securite-configuration/gouvernance-donnees/audit"
      queryKey="gouvernance-audit"
      exportDataset="audit"
      statLabels={[
        { key: 'total', label: 'Événements', subtitle: 'Total' },
        { key: 'recent', label: '7 jours', subtitle: 'Activité récente' },
        { key: 'loginCount', label: 'Connexions', subtitle: 'LOGIN' },
        { key: 'today', label: "Aujourd'hui", subtitle: 'Événements du jour' },
        { key: 'ipCount', label: 'Adresses IP', subtitle: 'Page courante' },
      ]}
      columns={[
        { key: 'event', label: 'Événement' },
        { key: 'user', label: 'Utilisateur' },
        { key: 'description', label: 'Détail' },
        { key: 'ipAddress', label: 'IP' },
      ]}
    />
  );
}
