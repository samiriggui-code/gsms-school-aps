'use client';

import { LeafScaffoldPage } from '@/components/common/leaf-scaffold-page';

export default function FinanceursPage() {
  return (
    <LeafScaffoldPage
      path="/administration-facturation/finance/financeurs"
      chantierId="GSMS-OF-04"
      summary="Registre financeurs (OPCO, CPF, France Travail, entreprise) — source unique pour sessions, PDF et BPF."
      nextSteps={[
        'Modèle Prisma Financeur + taxonomie',
        'CRUD liste + fiche (pattern DataGrid Type A)',
        'Rattachement session / participant / devis',
      ]}
      stats={[
        { label: 'Financeurs', value: '0', detail: 'Registre' },
        { label: 'OPCO / CPF', value: '0', detail: 'Canaux' },
        { label: 'Liés sessions', value: '0', detail: 'Usage' },
      ]}
      backHref="/administration-facturation/finance"
    />
  );
}
