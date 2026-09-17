import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  SupportStats,
  SupportWelcomeCallout,
  SupportOverviewTable,
  SupportDistributionChart,
  SupportEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function SupportLandingPage() {
  return (
    <CrmWiredLeaf path="/support-qualite/support" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <SupportStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SupportWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <SupportDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SupportEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SupportOverviewTable />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
