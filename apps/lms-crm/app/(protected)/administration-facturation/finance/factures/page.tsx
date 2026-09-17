'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Suspense, useMemo } from 'react';
import { Container } from '@/components/common/container';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { financeFacturesExportConfig } from '@/lib/datagrid/export-presets';
import { FinanceFacturePageActions } from './components/finance-facture-page-actions';
import { FactureStats } from './components/facture-stats';
import { FactureList } from './components/facture-list';

export default function Page() {
  const { t } = useTranslation();
  const exportConfig = useMemo(() => financeFacturesExportConfig(), []);

  const hubHeading = (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">Factures</h3>
      <p className="text-muted-foreground text-xs">
        Devis au statut <span className="font-medium text-foreground">ACCEPTED</span> — même
        enregistrement que dans Devis, vue facturation (PDF, paiements, export).
      </p>
    </div>
  );

  return (
    <CrmWiredLeaf
      path="/administration-facturation/finance/factures"
      actions={
        <>
          <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
          <FinanceFacturePageActions />
        </>
      }
    >
      <Container className="space-y-5 lg:space-y-7.5">
        <FactureStats variant="row" />
        <Suspense fallback={null}>
          <FactureList leaderSlot={hubHeading} />
        </Suspense>
      </Container>
    </CrmWiredLeaf>
  );
}
