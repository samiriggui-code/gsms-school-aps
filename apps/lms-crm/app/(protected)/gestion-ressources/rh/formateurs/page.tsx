'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import FormateurList from './components/formateur-list';
import { FormateurStats } from './components/formateur-stats';
import { Button } from '@repo/ui/button';
import { UserPlus } from 'lucide-react';
import FormateurAddSheet from './components/formateur-add-sheet';
import { Container } from '@/components/common/container';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { formateursExportConfig } from '@/lib/datagrid/export-presets';

export default function Page() {
  const { t } = useTranslation();

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const exportConfig = useMemo(() => formateursExportConfig(), []);

  return (
    <CrmWiredLeaf
      path="/gestion-ressources/rh/formateurs"
      actions={
        <div className={DATAGRID_TOOLBAR_ACTIONS}>
          <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
          <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
            <UserPlus className="size-4" />
            Ajouter un formateur
          </Button>
        </div>
      }
    >
      <Container className="space-y-5 lg:space-y-7.5">
        <FormateurStats variant="row" />
        <FormateurList />
      </Container>
      <FormateurAddSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
      />
    </CrmWiredLeaf>
  );
}
