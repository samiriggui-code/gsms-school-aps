'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { AccountNotificationsDatagrid } from './components/account-notifications-datagrid';

export default function AccountNotificationsPage() {
  const { title, description } = usePageToolbarMeta('/account/notifications');

  return (
    <Container className="pb-8">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>{title}</ToolbarTitle>
          <ToolbarDescription>{description}</ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      <div className="mt-6">
        <AccountNotificationsDatagrid />
      </div>
    </Container>
  );
}
