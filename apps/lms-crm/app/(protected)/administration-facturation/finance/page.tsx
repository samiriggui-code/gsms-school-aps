'use client';

import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { useModuleLayout } from '@/hooks/use-module-layout';
import {
  FinanceStats,
  FinanceWelcomeCallout,
  FinanceDistributionChart,
  FinanceEvolutionChart,
  FinanceOperationsTable,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function FinanceLandingPage() {
  const { isVisible } = useModuleLayout('finance-landing');

  return (
    <CrmWiredLeaf path="/administration-facturation/finance" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        {(isVisible('stats') || isVisible('welcome')) && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {isVisible('stats') ? (
              <div className="min-w-0 h-full lg:col-span-1">
                <FinanceStats />
              </div>
            ) : null}
            {isVisible('welcome') ? (
              <div
                className={`min-w-0 h-full ${isVisible('stats') ? 'lg:col-span-2' : 'lg:col-span-3'}`}
              >
                <FinanceWelcomeCallout />
              </div>
            ) : null}
          </div>
        )}

        {isVisible('charts') && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 h-full lg:col-span-1">
              <FinanceDistributionChart />
            </div>
            <div className="min-w-0 h-full lg:col-span-2">
              <FinanceEvolutionChart />
            </div>
          </div>
        )}

        {(isVisible('alerts') || isVisible('operations')) && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {isVisible('alerts') ? (
              <div className="min-w-0 h-full lg:col-span-1">
                <ComplianceAlerts />
              </div>
            ) : null}
            {isVisible('operations') ? (
              <div
                className={`min-w-0 h-full ${isVisible('alerts') ? 'lg:col-span-2' : 'lg:col-span-3'}`}
              >
                <FinanceOperationsTable />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </CrmWiredLeaf>
  );
}
