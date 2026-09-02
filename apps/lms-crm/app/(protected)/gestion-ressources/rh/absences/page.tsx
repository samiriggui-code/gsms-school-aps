'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import { Button } from '@repo/ui/button';
import { CalendarPlus } from 'lucide-react';
import AbsenceList from './components/absence-list';
import { AbsenceStats } from './components/absence-stats';
import AbsenceAddSheet from './components/absence-add-sheet';
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
import { absencesExportConfig } from '@/lib/datagrid/export-presets';

export default function AbsencesPage() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-ressources/rh/absences');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const exportConfig = useMemo(() => absencesExportConfig(), []);

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
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              className="gap-2 font-bold uppercase text-2sm shadow-sm"
            >
              <CalendarPlus className="size-4" />
              Nouvelle absence
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <AbsenceStats variant="row" />
        <AbsenceList />
      </Container>
<AbsenceAddSheet 
        open={isAddSheetOpen} 
        onOpenChange={setIsAddSheetOpen} 
      />
    </>
  );
}
