'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { apiFetch } from '@/lib/api';
import { FinanceFacturePageActions } from './components/finance-facture-page-actions';
import { FactureStats } from './components/facture-stats';
import { FactureList } from './components/facture-list';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/administration-facturation/finance/factures');
  const exportCsv = useCallback(async () => {
    try {
      const res = await apiFetch('/api/sections/administration-facturation/finance/factures/export');
      if (!res.ok) {
        toast.error(t('governance.exportFailed'));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('governance.exportSuccess'));
    } catch {
      toast.error(t('governance.exportFailed'));
    }
  }, [t]);

  const hubHeading = (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">Factures</h3>
      <p className="text-muted-foreground text-xs">
        Propositions acceptées prêtes à facturer — détail et actions via les endpoints Facturation (PDF proposition :
        aperçu imprimable).
      </p>
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
            <Button variant="outline" type="button" onClick={exportCsv}>
              <Download />{t('common.actions.export')}</Button>
            <FinanceFacturePageActions />
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <FactureStats variant="row" />
        <Suspense fallback={null}>
          <FactureList leaderSlot={hubHeading} />
        </Suspense>
      </Container>
    </>
  );
}
