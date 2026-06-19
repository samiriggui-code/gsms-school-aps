'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import FormationList from './components/formation-list';
import { FormationStats } from './components/formation-stats';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
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
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { LandingCatalogPublishButton } from '@/components/landing-catalog-publish-button';
import { formationsExportConfig } from '@/lib/datagrid/export-presets';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-academique/vie-scolaire/formations');
  const [isAddCatalogOpen, setIsAddCatalogOpen] = useState(false);
  const exportConfig = useMemo(() => formationsExportConfig(), []);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex flex-wrap items-center gap-2">
            <LandingCatalogPublishButton />
            <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
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
