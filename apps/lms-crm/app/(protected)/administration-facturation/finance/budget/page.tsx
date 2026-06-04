'use client';

import { useState } from 'react';
import { SimpleCrudModulePage } from '@/components/crud/simple-crud-module-page';

function fmtMoney(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function Page() {
  const year = new Date().getFullYear();
  const [periodYear] = useState(String(year));

  return (
    <SimpleCrudModulePage
      workspaceKey="finance-budget"
      i18nParams={{ year: periodYear }}
      apiPath="/api/sections/administration-facturation/finance/budget"
      queryKey="finance-budget"
      extraQueryParams={{ year: periodYear }}
      statLabels={[
        { key: 'total', label: 'Lignes', subtitle: `Exercice ${periodYear}` },
        { key: 'planned', label: 'Prévu', subtitle: 'Total planifié' },
        { key: 'actual', label: 'Réalisé', subtitle: 'Consommé' },
        { key: 'ecart', label: 'Écart', subtitle: 'Prévu − réalisé' },
        { key: 'consumptionRate', label: 'Consommation', subtitle: 'Réalisé / prévu (%)' },
      ]}
      columns={[
        { key: 'label', label: 'Libellé' },
        { key: 'category', label: 'Catégorie' },
        { key: 'plannedAmount', label: 'Prévu', align: 'right', format: fmtMoney },
        { key: 'actualAmount', label: 'Réalisé', align: 'right', format: fmtMoney },
      ]}
      createFields={[
        { name: 'label', label: 'Libellé', required: true },
        { name: 'category', label: 'Catégorie', defaultValue: 'FORMATION' },
        { name: 'periodYear', label: 'Année', type: 'number', defaultValue: periodYear },
        { name: 'plannedAmount', label: 'Montant prévu (€)', type: 'number', required: true },
        { name: 'actualAmount', label: 'Montant réalisé (€)', type: 'number', defaultValue: 0 },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
