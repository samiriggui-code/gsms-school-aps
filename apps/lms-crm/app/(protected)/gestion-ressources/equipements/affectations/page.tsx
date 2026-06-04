'use client';

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
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { AffectationAddSheet } from './components/affectation-add-sheet';
import { AffectationsStats } from './components/affectations-stats';
import { AffectationsList } from './components/affectations-list';

export default function EquipementsAffectationsPage() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/affectations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5 w-full min-w-0 overflow-hidden">
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <CalendarPlus className="size-4" />
              Nouvelle affectation
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <AffectationsStats searchQuery={searchQuery} />
        <AffectationsList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </Container>
<AffectationAddSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
    </div>
  );
}
