'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import CollaborateurList from './components/collaborateur-list';
import { CollaborateurStats } from './components/collaborateur-stats';
import { Button } from '@/components/ui/button';
import { Download, UserPlus } from 'lucide-react';
import CollaborateurAddSheet from './components/collaborateur-add-sheet';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/gestion-ressources/rh/collaborateurs');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [listeSegment, setListeSegment] = useState<'collaborateur' | 'interne'>('collaborateur');

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex items-center gap-2">
            <Button variant="outline">
              <Download />{t('common.actions.export')}</Button>
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <UserPlus className="size-4" />
              {t('common.actions.addCollaborator')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <CollaborateurStats variant="row" profileSegment={listeSegment} />
        <CollaborateurList
          profileSegment={listeSegment}
          onProfileSegmentChange={setListeSegment}
        />
      </Container>
      <CollaborateurAddSheet 
        open={isAddSheetOpen} 
        onOpenChange={setIsAddSheetOpen} 
      />
    </>
  );
}