'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import InventaireList from './components/inventaire-list';
import { InventaireStats } from './components/inventaire-stats';
import { Button } from '@/components/ui/button';
import { PackagePlus } from 'lucide-react';
import InventaireAddSheet from './components/inventaire-add-sheet';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { inventaireExportConfig } from '@/lib/datagrid/export-presets';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/inventaire');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const exportConfig = useMemo(() => inventaireExportConfig(searchQuery), [searchQuery]);

  return (
    <>
      <Container className="w-full">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <PackagePlus className="size-4" />
              Ajouter un équipement
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8 w-full min-w-0">
        <InventaireStats variant="row" searchQuery={searchQuery} />
        <InventaireList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </Container>

      <InventaireAddSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
    </>
  );
}
