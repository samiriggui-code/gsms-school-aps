import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  SeoStats,
  SeoWelcomeCallout,
  SeoOverviewTable,
  SeoDistributionChart,
  SeoEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function SeoLandingPage() {
  return (
    <CrmWiredLeaf path="/communication-contenu/seo" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <SeoStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SeoWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <SeoDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SeoEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SeoOverviewTable />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
