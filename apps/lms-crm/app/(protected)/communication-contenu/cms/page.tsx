import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  CmsStats,
  CmsWelcomeCallout,
  CmsOverviewTable,
  CmsDistributionChart,
  CmsEvolutionChart,
} from './components';
import { ComplianceAlerts } from './components/compliance-alerts';

export default function CmsLandingPage() {
  return (
    <CrmWiredLeaf path="/communication-contenu/cms" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <CmsStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <CmsWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <CmsDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <CmsEvolutionChart />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <ComplianceAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <CmsOverviewTable />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
