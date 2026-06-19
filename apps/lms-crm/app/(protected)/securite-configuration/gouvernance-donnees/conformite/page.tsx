'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { ConformiteGlobalStats } from './components/conformite-global-stats';
import { ConformiteGlobalList } from './components/conformite-global-list';

export default function Page() {
  const { title, description } = usePageToolbarMeta(
    '/securite-configuration/gouvernance-donnees/conformite',
  );

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

      <Container className="space-y-5 lg:space-y-7.5">
        <ConformiteGlobalStats />
        <ConformiteGlobalList />
      </Container>
    </>
  );
}
