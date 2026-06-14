'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { PilotageLandingDashboard } from './components/pilotage-landing-dashboard';

export default function PilotageLandingPage() {
  const { title, description } = usePageToolbarMeta('/pilotage-supervision/pilotage');

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
      <Container>
        <PilotageLandingDashboard />
      </Container>
    </>
  );
}
