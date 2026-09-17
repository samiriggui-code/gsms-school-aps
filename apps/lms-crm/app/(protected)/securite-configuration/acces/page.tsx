import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  AccesStats,
  AccesWelcomeCallout,
  AccesOverviewTable,
  AccesDistributionChart,
  AccesEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function AccesLandingPage() {
  return (
    <CrmWiredLeaf path="/securite-configuration/acces" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <AccesStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <AccesWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <AccesDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <AccesEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <AccesOverviewTable />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
