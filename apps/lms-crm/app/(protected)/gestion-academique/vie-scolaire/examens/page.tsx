'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { ExamensParcoursStats } from './components/examens-parcours-stats';
import { ParcoursSessionExamensPanel } from './components/parcours-session-examens-panel';

export default function Page() {
  const { title, description } = usePageToolbarMeta('/gestion-academique/vie-scolaire/examens');
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
        <ExamensParcoursStats />
        <ParcoursSessionExamensPanel />
      </Container>
    </>
  );
}
