import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  IaAlerts,
  IaHistoriquePanel,
  IaOverviewTable,
  IaStats,
  IaStatusBreakdown,
  IaWelcomeCallout,
} from './components';

/**
 * Module IA — hub 3 rangées (pattern Compagnie / Support) :
 * 1) stats + welcome · 2) alertes + aperçu · 3) répartition + historique.
 */
export default function IaModulePage() {
  return (
    <CrmWiredLeaf path="/qualiopi/ia" level="module">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <IaStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <IaWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <IaAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <IaOverviewTable />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <IaStatusBreakdown />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <IaHistoriquePanel />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
