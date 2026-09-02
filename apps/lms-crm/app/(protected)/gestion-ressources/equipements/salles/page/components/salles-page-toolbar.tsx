'use client';

import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@repo/ui/button';
import { Theater } from 'lucide-react';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { sallesExportConfig } from '@/lib/datagrid/export-presets';
import { useMemo } from 'react';

export function SallesPageToolbar({
  onAdd,
  searchQuery = '',
}: {
  onAdd: () => void;
  searchQuery?: string;
}) {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements/salles');
  const exportConfig = useMemo(() => sallesExportConfig(searchQuery), [searchQuery]);

  return (
    <Toolbar>
      <ToolbarHeading>
        <ToolbarTitle>{title || 'Salles de formation'}</ToolbarTitle>
        <ToolbarDescription>
          {description || 'Référentiel des salles, disponibilité et planning des sessions.'}
        </ToolbarDescription>
      </ToolbarHeading>
      <ToolbarActions className="gap-2">
        <DataGridExportMenu config={exportConfig} label="Exporter" />
        <Button onClick={onAdd} className="gap-2">
          <Theater className="size-4" />
          Nouvelle salle
        </Button>
      </ToolbarActions>
    </Toolbar>
  );
}
