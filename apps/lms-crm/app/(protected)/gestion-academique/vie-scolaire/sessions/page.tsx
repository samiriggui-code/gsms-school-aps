'use client';



import { useTranslation } from '@/hooks/useTranslation';
import { Suspense, useMemo, useState } from 'react';

import { UserPlus } from 'lucide-react';

import { Button } from '@repo/ui/button';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { sessionsExportConfig } from '@/lib/datagrid/export-presets';

import { Container } from '@/components/common/container';

import {

  Toolbar,

  ToolbarActions,

  ToolbarHeading,

  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';


import { SessionsSummary } from './components/sessions-summary';

import { SessionsManager } from './components/sessions-manager';

import FormationSessionAddSheet from './components/sheets/formation-session-add-sheet';

import { FormationSessionSheetCustomer } from './components/sheets/formation-session-sheet-customer';

import type { FormationSessionApiRow } from './types/formation-session-api-row';



export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-academique/vie-scolaire/sessions');

  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const [addDraft, setAddDraft] = useState<FormationSessionApiRow | null>(null);



  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const [detailSession, setDetailSession] = useState<FormationSessionApiRow | null>(null);

  const exportConfig = useMemo(() => sessionsExportConfig(), []);



  const openCreate = () => {

    setAddDraft(null);

    setAddSheetOpen(true);

  };



  const openEdit = (row: FormationSessionApiRow) => {

    setAddDraft(row);

    setAddSheetOpen(true);

  };



  const openDetail = (row: FormationSessionApiRow) => {

    setDetailSession(row);

    setDetailSheetOpen(true);

  };



  const onAddSheetOpenChange = (open: boolean) => {

    setAddSheetOpen(open);

    if (!open) setAddDraft(null);

  };



  const onDetailSheetOpenChange = (open: boolean) => {

    setDetailSheetOpen(open);

    if (!open) setDetailSession(null);

  };



  const goEditFromDetail = () => {

    if (!detailSession) return;

    const row = detailSession;

    setDetailSheetOpen(false);

    setDetailSession(null);

    setAddDraft(row);

    setAddSheetOpen(true);

  };



  return (

    <>

      <Container>

        <Toolbar>

          <ToolbarHeading>

            <ToolbarTitle>{title}</ToolbarTitle>

            <ToolbarDescription>{description}</ToolbarDescription>

          </ToolbarHeading>

          <ToolbarActions className="flex items-center gap-2">

            <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />

            <Button variant="primary" type="button" className="gap-2" onClick={openCreate}>

              <UserPlus className="size-4" />

              Nouvelle session

            </Button>

          </ToolbarActions>

        </Toolbar>

      </Container>



      <Container className="space-y-5 lg:space-y-7.5">

        <SessionsSummary variant="row" />

        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Chargement de la liste des sessions…</p>
          }
        >
          <SessionsManager onEditSession={openEdit} onViewSession={openDetail} />
        </Suspense>

      </Container>



      <FormationSessionAddSheet open={addSheetOpen} onOpenChange={onAddSheetOpenChange} draft={addDraft} />



      <FormationSessionSheetCustomer

        open={detailSheetOpen}

        onOpenChange={onDetailSheetOpenChange}

        session={detailSession}

        onEditClick={goEditFromDetail}

        onSessionRefreshed={setDetailSession}

      />

    </>

  );

}

