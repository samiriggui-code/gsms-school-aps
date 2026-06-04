'use client';

import { GovernanceHubPage } from '@/components/governance/governance-hub-page';

export default function Page() {
  return (
    <GovernanceHubPage
      workspaceKey="gouvernance-demandes"
      apiPath="/api/sections/securite-configuration/gouvernance-donnees/demandes"
      queryKey="gouvernance-demandes"
      linkKey="editPath"
      statLabels={[
        { key: 'total', label: 'Dossiers ouverts', subtitle: 'En cours' },
        { key: 'missing', label: 'Pièces manquantes', subtitle: 'À relancer' },
        { key: 'pending', label: 'En validation', subtitle: 'Instruction' },
        { key: 'draft', label: 'Brouillons', subtitle: 'Landing / CRM' },
        { key: 'submitted', label: 'Transmis', subtitle: 'En attente instruction' },
      ]}
      columns={[
        { key: 'candidat', label: 'Candidat' },
        { key: 'email', label: 'E-mail' },
        { key: 'formation', label: 'Formation' },
        { key: 'status', label: 'Statut' },
      ]}
    />
  );
}
