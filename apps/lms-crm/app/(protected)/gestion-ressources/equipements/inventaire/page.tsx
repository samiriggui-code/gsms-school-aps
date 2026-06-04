'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import InventaireList from './components/inventaire-list';
import { InventaireStats } from './components/inventaire-stats';
import { Button } from '@/components/ui/button';
import { Download, PackagePlus } from 'lucide-react';
import InventaireAddSheet from './components/inventaire-add-sheet';
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

  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/inventaire');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5 w-full min-w-0 overflow-hidden">
      <Container className="w-full">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="size-4" />{t('common.actions.export')}</Button>
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <PackagePlus className="size-4" />
              Ajouter un équipement
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 w-full min-w-0">
        <InventaireStats variant="row" searchQuery={searchQuery} />
        <InventaireList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </Container>

      <div className="mt-auto">
</div>

      <InventaireAddSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
      />
    </div>
  );
}
