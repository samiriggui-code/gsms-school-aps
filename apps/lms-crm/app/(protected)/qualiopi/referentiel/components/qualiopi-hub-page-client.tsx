'use client';

import { QualiopiAlerts } from './qualiopi-alerts';
import { QualiopiGapsAssistantPanel } from './qualiopi-gaps-assistant-panel';
import { QualiopiHistoriquePanel } from './qualiopi-historique-panel';
import { QualiopiOverviewTable } from './qualiopi-overview-table';
import { QualiopiStats } from './qualiopi-stats';
import { QualiopiStatusBreakdown } from './qualiopi-status-breakdown';
import { QualiopiWelcomeCallout } from './qualiopi-welcome-callout';

/** Hub Qualiopi — lit uniquement ce que le moteur / le classeur enregistrent. */
export function QualiopiHubPageClient() {
  return (
    <div className="space-y-5 lg:space-y-7.5 pb-8">
      <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
        <div className="min-w-0 h-full lg:col-span-1">
          <QualiopiStats />
        </div>
        <div className="min-w-0 h-full lg:col-span-2">
          <QualiopiWelcomeCallout />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <QualiopiOverviewTable />
        </div>
        <div className="space-y-5">
          <QualiopiAlerts />
          <QualiopiStatusBreakdown />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
        <QualiopiGapsAssistantPanel />
        <QualiopiHistoriquePanel />
      </div>
    </div>
  );
}
