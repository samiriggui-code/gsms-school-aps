'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DocsCircuitsStats } from './components/docs-circuits-stats';
import { DocsCircuitsWelcomeCallout } from './components/docs-circuits-welcome-callout';
import { DocsCircuitsSurveysTable } from './components/docs-circuits-surveys-table';
import { DocsCircuitsRunsTable } from './components/docs-circuits-runs-table';

/**
 * Module Docs & circuits — pattern hub (comme Support / RH) :
 * stats + welcome → tables récentes (enquêtes / circuits). Pas de cartes « Accéder ».
 */
export default function DocsCircuitsModulePage() {
  const { title, description } = usePageToolbarMeta('/support-qualite/docs-circuits');

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
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <DocsCircuitsStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <DocsCircuitsWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full">
            <DocsCircuitsSurveysTable />
          </div>
          <div className="min-w-0 h-full">
            <DocsCircuitsRunsTable />
          </div>
        </div>
      </Container>
    </>
  );
}
