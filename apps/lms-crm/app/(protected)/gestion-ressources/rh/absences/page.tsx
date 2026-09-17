'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import { Button } from '@repo/ui/button';
import { CalendarPlus } from 'lucide-react';
import AbsenceList from './components/absence-list';
import { AbsenceStats } from './components/absence-stats';
import AbsenceAddSheet from './components/absence-add-sheet';
import { Container } from '@/components/common/container';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { absencesExportConfig } from '@/lib/datagrid/export-presets';

export default function AbsencesPage() {
  const { t } = useTranslation();

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const exportConfig = useMemo(() => absencesExportConfig(), []);

  return (
    <CrmWiredLeaf
      path="/gestion-ressources/rh/absences"
      actions={
        <div className={DATAGRID_TOOLBAR_ACTIONS}>
          <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
          <Button
            onClick={() => setIsAddSheetOpen(true)}
            className="gap-2 font-bold uppercase text-2sm shadow-sm"
          >
            <CalendarPlus className="size-4" />
            Nouvelle absence
          </Button>
        </div>
      }
    >
      <Container className="space-y-5 lg:space-y-7.5">
        <AbsenceStats variant="row" />
        <AbsenceList />
      </Container>
      <AbsenceAddSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
      />
    </CrmWiredLeaf>
  );
}
