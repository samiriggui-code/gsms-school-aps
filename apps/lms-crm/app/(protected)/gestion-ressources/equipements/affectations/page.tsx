'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { affectationsExportConfig } from '@/lib/datagrid/export-presets';
import { AffectationAddSheet } from './components/affectation-add-sheet';
import { AffectationsStats } from './components/affectations-stats';
import { AffectationsList } from './components/affectations-list';

export default function EquipementsAffectationsPage() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/affectations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const exportConfig = useMemo(() => affectationsExportConfig(searchQuery), [searchQuery]);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <CalendarPlus className="size-4" />
              Nouvelle affectation
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <AffectationsStats searchQuery={searchQuery} />
        <AffectationsList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </Container>

      <AffectationAddSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
    </>
  );
}
