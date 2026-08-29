'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { QualiopiStats } from './components/qualiopi-stats';
import { QualiopiWelcomeCallout } from './components/qualiopi-welcome-callout';
import { QualiopiAlerts } from './components/qualiopi-alerts';
import { QualiopiOverviewTable } from './components/qualiopi-overview-table';
import { QualiopiStatusBreakdown } from './components/qualiopi-status-breakdown';
import { QualiopiHistoriquePanel } from './components/qualiopi-historique-panel';

/**
 * Module Qualiopi — hub 3 rangées (pattern Compagnie / Support) :
 * 1) stats + welcome · 2) alertes + aperçu · 3) répartition + historique.
 */
export default function QualiopiModulePage() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/qualiopi');

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
            <QualiopiStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <QualiopiWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <QualiopiAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <QualiopiOverviewTable />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <QualiopiStatusBreakdown />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <QualiopiHistoriquePanel />
          </div>
        </div>
      </Container>
    </>
  );
}
