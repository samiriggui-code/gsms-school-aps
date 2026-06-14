'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
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
import { Download, CalendarPlus } from 'lucide-react';
import { AffectationAddSheet } from './components/affectation-add-sheet';
import { AffectationsStats } from './components/affectations-stats';
import { AffectationsList } from './components/affectations-list';

export default function EquipementsAffectationsPage() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/affectations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <Button variant="outline" type="button">
              <Download className="size-4" />
              {t('common.actions.export')}
            </Button>
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
