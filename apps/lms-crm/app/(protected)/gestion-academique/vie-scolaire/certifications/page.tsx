'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { ParcoursSessionCertificationsPanel } from './components/parcours-session-certifications-panel';

export default function Page() {
  const { title, description } = usePageToolbarMeta('/gestion-academique/vie-scolaire/certifications');
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
        <ParcoursSessionCertificationsPanel />
      </Container>
    </>
  );
}
