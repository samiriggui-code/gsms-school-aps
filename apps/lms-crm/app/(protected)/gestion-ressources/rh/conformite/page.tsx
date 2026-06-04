'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import ConformiteList from './components/conformite-list';
import { ConformiteStats } from './components/conformite-stats';
import { Button } from '@/components/ui/button';
import { Download, ShieldCheck } from 'lucide-react';
import ConformiteAddSheet from './components/conformite-add-sheet';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-ressources/rh/conformite');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex items-center gap-2">
            <Button variant="outline">
              <Download />{t('common.actions.export')}</Button>
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <ShieldCheck className="size-4" />
              Nouveau contrôle
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <ConformiteStats variant="row" />
        <ConformiteList />
      </Container>
      <ConformiteAddSheet 
        open={isAddSheetOpen} 
        onOpenChange={setIsAddSheetOpen} 
      />
    </>
  );
}