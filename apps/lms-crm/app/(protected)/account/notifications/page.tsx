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
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <AccountNotificationsDatagrid />
      </Container>
    </>
  );
}
