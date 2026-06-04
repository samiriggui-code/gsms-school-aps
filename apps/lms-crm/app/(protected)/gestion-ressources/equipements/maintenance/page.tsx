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
import { Wrench } from 'lucide-react';
import { MaintenanceAddSheet } from './components/maintenance-add-sheet';
import { MaintenanceStats } from './components/maintenance-stats';
import { MaintenanceList } from './components/maintenance-list';

export default function EquipementsMaintenancePage() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/maintenance');
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
              <Wrench className="size-4" />
              Nouvelle intervention
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <MaintenanceStats />
        <MaintenanceList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </Container>
<MaintenanceAddSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
    </div>
  );
}
