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
import { useTranslation } from '@/hooks/useTranslation';
import { RolesStatsSection } from './components/roles-stats-section';
import RoleList from './components/role-list';

export default function Page() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/securite-configuration/acces/roles');

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
      <Container>
        <RolesStatsSection firstMetricTitle="Roles" />
      </Container>
      <Container>
        <RoleList />
      </Container>
</>
  );
}
