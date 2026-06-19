'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { RolesStatsSection } from './components/roles-stats-section';
import RoleList from './components/role-list';

export default function Page() {
  const { title, description } = usePageToolbarMeta('/securite-configuration/acces/roles');

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
        <RolesStatsSection firstMetricTitle="Rôles" />
        <RoleList />
      </Container>
    </>
  );
}
