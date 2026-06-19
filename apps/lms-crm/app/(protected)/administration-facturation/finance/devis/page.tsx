'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Suspense, useMemo } from 'react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { financeDevisExportConfig } from '@/lib/datagrid/export-presets';
import { FinanceDevisPageActions } from './components/finance-devis-page-actions';
import { DevisStats } from './components/devis-stats';
import { DevisList } from './components/devis-list';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/administration-facturation/finance/devis');
  const exportConfig = useMemo(() => financeDevisExportConfig(), []);
  const hubHeading = (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">Devis</h3>
      <p className="text-muted-foreground text-xs">Liste adaptée aux données devis Finance réelles.</p>
    </div>
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex flex-wrap items-center gap-2">
            <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
            <FinanceDevisPageActions />
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <DevisStats variant="row" />
        <Suspense fallback={null}>
          <DevisList leaderSlot={hubHeading} />
        </Suspense>
      </Container>
    </>
  );
}
