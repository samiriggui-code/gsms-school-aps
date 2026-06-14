'use client';

import { Download } from 'lucide-react';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PermissionsStatsSection } from './components/permissions-stats-section';
import PermissionList from './components/permission-list';

export default function Page() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/securite-configuration/acces/permissions');

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <Button variant="outline">
              <Download />
              {t('common.actions.export')}
            </Button>
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
        <PermissionsStatsSection firstMetricTitle="Permissions" />
        <PermissionList />
      </Container>
</>
  );
}
