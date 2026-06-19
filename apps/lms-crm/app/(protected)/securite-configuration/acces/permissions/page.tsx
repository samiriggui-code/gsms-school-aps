'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { PermissionsStatsSection } from './components/permissions-stats-section';
import PermissionList from './components/permission-list';

export default function Page() {
  const { title, description } = usePageToolbarMeta('/securite-configuration/acces/permissions');

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
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <PermissionsStatsSection firstMetricTitle="Permissions" />
        <PermissionList />
      </Container>
    </>
  );
}
