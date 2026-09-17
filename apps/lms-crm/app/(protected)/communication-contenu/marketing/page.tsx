import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  MarketingStats,
  MarketingWelcomeCallout,
  MarketingOverviewTable,
  MarketingDistributionChart,
  MarketingEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function MarketingLandingPage() {
  return (
    <CrmWiredLeaf path="/communication-contenu/marketing" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <MarketingStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <MarketingWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <MarketingDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <MarketingEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <MarketingOverviewTable />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
