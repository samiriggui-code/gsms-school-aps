'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Suspense, useMemo, useState } from 'react';
import CollaborateurList from './components/collaborateur-list';
import { CollaborateurStats } from './components/collaborateur-stats';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import CollaborateurAddSheet from './components/collaborateur-add-sheet';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { collaborateursExportConfig } from '@/lib/datagrid/export-presets';
import type { RhCollaborateurListSegment } from '@/lib/rh-collaborateur-list-segment';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-ressources/rh/collaborateurs');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [listeSegment, setListeSegment] = useState<RhCollaborateurListSegment>('collaborateur');
  const exportConfig = useMemo(
    () => collaborateursExportConfig(listeSegment),
    [listeSegment],
  );

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
              <UserPlus className="size-4" />
              {t('common.actions.addCollaborator')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <CollaborateurStats variant="row" profileSegment={listeSegment} />
        <Suspense fallback={null}>
          <CollaborateurList
            profileSegment={listeSegment}
            onProfileSegmentChange={setListeSegment}
          />
        </Suspense>
      </Container>
      <CollaborateurAddSheet 
        open={isAddSheetOpen} 
        onOpenChange={setIsAddSheetOpen} 
      />
    </>
  );
}