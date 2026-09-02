'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Container } from '@/components/common/container';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { useTranslation } from '@/hooks/useTranslation';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { usersExportConfig } from '@/lib/datagrid/export-presets';
import { UsersStatsSection } from './components/users-stats-section';
import { UserListTable } from './components/user-list-table';
import { cn } from '@/lib/utils';

export default function Page() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/securite-configuration/acces/users');
  const exportConfig = useMemo(() => usersExportConfig(), []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUsers = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('lms-users-refresh'));
    window.setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <Button variant="outline" type="button" disabled={isRefreshing} onClick={refreshUsers}>
              <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
              {t('crud.refresh')}
            </Button>
            <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{t('common.actions.moreActions')}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Mise a jour groupee</DropdownMenuItem>
                <DropdownMenuItem>Assigner un role</DropdownMenuItem>
                <DropdownMenuItem>Archiver la selection</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <UsersStatsSection firstMetricTitle="Utilisateurs" />
        <UserListTable showStats={false} />
      </Container>
</>
  );
}
