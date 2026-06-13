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
  CompagnieStats, 
  CompagnieWelcomeCallout, 
  CompagnieOverviewTable,
  CompagnieDistributionChart,
  CompagnieEvolutionChart
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function CompagnieDashboardPage() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/compagnie');
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
            <CompagnieStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <CompagnieWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <CompagnieOverviewTable />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <CompagnieDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <CompagnieEvolutionChart />
          </div>
        </div>
      </Container>
</>
  );
}
