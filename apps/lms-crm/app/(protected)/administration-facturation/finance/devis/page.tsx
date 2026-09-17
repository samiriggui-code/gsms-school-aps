'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Suspense } from 'react';
import { Container } from '@/components/common/container';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { financeDevisExportConfig } from '@/lib/datagrid/export-presets';
import { FinanceDevisPageActions } from './components/finance-devis-page-actions';
import { DevisStats } from './components/devis-stats';
import { DevisList } from './components/devis-list';
import { DevisWorkflowGuide } from './components/devis-workflow-guide';

export default function Page() {
  const { t } = useTranslation();
  const exportConfig = financeDevisExportConfig();

  return (
    <CrmWiredLeaf
      path="/administration-facturation/finance/devis"
      actions={
        <>
          <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
          <FinanceDevisPageActions />
        </>
      }
    >
      <Container className="space-y-5 lg:space-y-7.5">
        <DevisWorkflowGuide />
        <DevisStats variant="row" />
        <Suspense fallback={null}>
          <DevisList />
        </Suspense>
      </Container>
    </CrmWiredLeaf>
  );
}
