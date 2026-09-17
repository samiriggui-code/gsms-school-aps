import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  RHStats,
  RHWelcomeCallout,
  RHStaffTable,
  RHDistributionChart,
  RHEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function RHDashboardPage() {
  return (
    <CrmWiredLeaf path="/gestion-ressources/rh" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <RHStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <RHWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <RHStaffTable />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <RHDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <RHEvolutionChart />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
