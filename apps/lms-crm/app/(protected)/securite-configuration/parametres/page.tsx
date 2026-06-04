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
  ParametresStats,
  ParametresWelcomeCallout,
  ParametresOverviewTable,
  ParametresDistributionChart,
  ParametresEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function ParametresLandingPage() {
  const { title, description } = usePageToolbarMeta('/securite-configuration/parametres');
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
            <ParametresStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <ParametresWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ParametresDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <ParametresEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <ParametresOverviewTable />
          </div>
        </div>
      </Container>
</>
  );
}
