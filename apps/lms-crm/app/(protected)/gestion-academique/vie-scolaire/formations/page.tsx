'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import FormationList from './components/formation-list';
import { FormationStats } from './components/formation-stats';
import { Button } from '@/components/ui/button';
import { Download, UserPlus } from 'lucide-react';
import FormationAddCatalogSheet from './components/formation-add-catalog-sheet';
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

  const { title, description } = usePageToolbarMeta('/gestion-academique/vie-scolaire/formations');
  const [isAddCatalogOpen, setIsAddCatalogOpen] = useState(false);

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
            <Button onClick={() => setIsAddCatalogOpen(true)} className="gap-2" variant="primary">
              <UserPlus className="size-4" />
              Ajouter au catalogue
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <FormationStats variant="row" />
        <FormationList />
      </Container>
      <FormationAddCatalogSheet open={isAddCatalogOpen} onOpenChange={setIsAddCatalogOpen} />
    </>
  );
}
