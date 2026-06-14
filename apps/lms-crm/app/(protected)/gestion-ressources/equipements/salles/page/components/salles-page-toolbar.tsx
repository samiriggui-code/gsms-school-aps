'use client';

import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@/components/ui/button';
import { Theater } from 'lucide-react';

export function SallesPageToolbar({ onAdd }: { onAdd: () => void }) {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/salles');

  return (
    <Toolbar>
      <ToolbarHeading>
        <ToolbarTitle>{title || 'Salles de formation'}</ToolbarTitle>
        <ToolbarDescription>
          {description || 'Référentiel des salles, disponibilité et planning des sessions.'}
        </ToolbarDescription>
      </ToolbarHeading>
      <ToolbarActions>
        <Button onClick={onAdd} className="gap-2">
          <Theater className="size-4" />
          Nouvelle salle
        </Button>
      </ToolbarActions>
    </Toolbar>
  );
}
