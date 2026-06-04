'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import {
  VieScolaireStats,
  VieScolaireWelcomeCallout,
  VieScolaireOverviewTable,
  VieScolaireDistributionChart,
  VieScolaireEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function VieScolaireLandingPage() {
  const { title, description } = usePageToolbarMeta('/gestion-academique/vie-scolaire');
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
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <VieScolaireStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <VieScolaireWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <VieScolaireDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <VieScolaireEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <VieScolaireOverviewTable />
          </div>
        </div>
      </Container>
</>
  );
}
