'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { FinanceDevisPageActions } from './components/finance-devis-page-actions';
import { DevisStats } from './components/devis-stats';
import { DevisList } from './components/devis-list';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/administration-facturation/finance/devis');
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
            <Button variant="outline" type="button">
              <Download />{t('common.actions.export')}</Button>
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
