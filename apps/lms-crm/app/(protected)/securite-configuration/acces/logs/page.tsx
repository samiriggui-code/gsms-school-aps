'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Fragment } from 'react';
import { Download } from 'lucide-react';
import {
  ToolbarActions,
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountSecurityLogContent } from '../security-log/content';
import { AuditLogStatsSection } from './components/audit-log-stats-section';

export default function UserManagementLogsPage() {
  const { t } = useTranslation();

  const { settings } = useSettings();

  return (
    <Fragment>
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
            </ToolbarHeading>
            <ToolbarActions className="flex items-center gap-2">
              <Button variant="outline">
                <Download />{t('common.actions.export')}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Plus d'actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Marquer comme lu</DropdownMenuItem>
                  <DropdownMenuItem>{t('common.actions.exportSelection')}</DropdownMenuItem>
                  <DropdownMenuItem>Archiver la selection</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AuditLogStatsSection firstMetricTitle="Journal d'audit" />
      </Container>
      <Container>
        <AccountSecurityLogContent />
      </Container>
</Fragment>
  );
}
