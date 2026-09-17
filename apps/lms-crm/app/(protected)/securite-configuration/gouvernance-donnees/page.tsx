import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  GouvernanceStats,
  GouvernanceWelcomeCallout,
  GouvernanceOverviewTable,
  GouvernanceDistributionChart,
  GouvernanceEvolutionChart,
  GouvernanceDemandesAlerts,
} from './components';

export default function GouvernanceLandingPage() {
  return (
    <CrmWiredLeaf path="/securite-configuration/gouvernance-donnees" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <GouvernanceStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <GouvernanceWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <GouvernanceDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <GouvernanceEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <GouvernanceDemandesAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <GouvernanceOverviewTable />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
