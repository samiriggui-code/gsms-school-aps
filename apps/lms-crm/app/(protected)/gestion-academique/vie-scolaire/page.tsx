'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { useModuleLayout } from '@/hooks/use-module-layout';
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
  const { isVisible } = useModuleLayout('vie-scolaire-landing');
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
        {(isVisible('stats') || isVisible('welcome')) && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {isVisible('stats') ? (
              <div className="min-w-0 h-full lg:col-span-1">
                <VieScolaireStats />
              </div>
            ) : null}
            {isVisible('welcome') ? (
              <div
                className={`min-w-0 h-full ${isVisible('stats') ? 'lg:col-span-2' : 'lg:col-span-3'}`}
              >
                <VieScolaireWelcomeCallout />
              </div>
            ) : null}
          </div>
        )}

        {isVisible('menu-cards') && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 h-full lg:col-span-1">
              <ComplianceAlerts />
            </div>
            <div className="min-w-0 h-full lg:col-span-2">
              <VieScolaireOverviewTable />
            </div>
          </div>
        )}

        {isVisible('menu-cards') && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 h-full lg:col-span-1">
              <VieScolaireDistributionChart />
            </div>
            <div className="min-w-0 h-full lg:col-span-2">
              <VieScolaireEvolutionChart />
            </div>
          </div>
        )}
      </Container>
</>
  );
}
