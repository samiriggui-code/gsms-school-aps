'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import FormateurList from './components/formateur-list';
import { FormateurStats } from './components/formateur-stats';
import { Button } from '@/components/ui/button';
import { Download, Loader2, UserPlus } from 'lucide-react';
import FormateurAddSheet from './components/formateur-add-sheet';
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
import { useFormateursExport } from '@/lib/gestion-ressources/use-rh-list-export';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-ressources/rh/formateurs');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const { exportCsv, isExporting } = useFormateursExport();

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <Button variant="outline" onClick={() => void exportCsv()} disabled={isExporting}>
              {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download />}
              {t('common.actions.export')}
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <UserPlus className="size-4" />
              Ajouter un formateur
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <FormateurStats variant="row" />
        <FormateurList />
      </Container>
      <FormateurAddSheet 
        open={isAddSheetOpen} 
        onOpenChange={setIsAddSheetOpen} 
      />
    </>
  );
}