'use client';

import { Button } from '@/components/ui/button';
import { SimpleCrudModulePage } from '@/components/crud/simple-crud-module-page';
import { useTranslation } from '@/hooks/useTranslation';
import { workspaceActionLabel, workspaceStatusLabel } from '@/lib/workspace-labels';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

const WORKSPACE_KEY = 'finance-paiements';

function fmtMoney(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function Page() {
  const { t } = useTranslation();

  return (
    <SimpleCrudModulePage
      workspaceKey={WORKSPACE_KEY}
      apiPath="/api/sections/administration-facturation/finance/paiements"
      queryKey="finance-paiements"
      canDelete={false}
      statLabels={[
        { key: 'total', label: 'Total', subtitle: 'Paiements' },
        { key: 'pending', label: 'En attente', subtitle: 'À encaisser' },
        { key: 'received', label: 'Encaissés', subtitle: 'Reçus' },
        { key: 'pendingAmount', label: 'Montant dû', subtitle: 'Somme en attente' },
        { key: 'failed', label: 'Échoués', subtitle: 'Paiements en erreur' },
      ]}
      columns={[
        { key: 'referenceCode', label: 'Référence' },
        {
          key: 'devis',
          label: 'Devis',
          format: (v) => {
            const d = v as { referenceCode?: string; title?: string } | null;
            return d?.referenceCode ?? '—';
          },
        },
        { key: 'amount', label: 'Montant', align: 'right', format: fmtMoney },
        {
          key: 'status',
          label: 'Statut',
          format: (v) => workspaceStatusLabel(t, WORKSPACE_KEY, String(v), String(v)),
        },
        { key: 'method', label: 'Mode' },
      ]}
      createFields={[
        { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
        { name: 'devisId', label: 'ID devis (optionnel)' },
        { name: 'method', label: 'Mode (virement, CB…)' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      rowActions={(row, refresh) => {
        if (String(row.status) !== 'PENDING') return null;
        const id = String(row.id);
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await apiFetch(
                `/api/sections/administration-facturation/finance/paiements/${id}`,
                {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'RECEIVED' }),
                },
              );
              if (!res.ok) {
                toast.error(workspaceActionLabel(t, WORKSPACE_KEY, 'markReceivedFailed'));
              } else refresh();
            }}
          >
            {workspaceActionLabel(t, WORKSPACE_KEY, 'markReceived')}
          </Button>
        );
      }}
    />
  );
}
