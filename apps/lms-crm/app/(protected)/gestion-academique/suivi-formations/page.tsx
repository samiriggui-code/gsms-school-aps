import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  SuiviFormationsAlerts,
  SuiviFormationsBreakdown,
  SuiviFormationsRunsTable,
  SuiviFormationsStats,
  SuiviFormationsSurveysTable,
  SuiviFormationsWelcomeCallout,
} from './components';

/**
 * Module Suivi formations — hub 3 rangées (pattern Compagnie / Support) :
 * 1) stats + welcome · 2) alertes + enquêtes · 3) répartition + circuits.
 */
export default function SuiviFormationsModulePage() {
  return (
    <CrmWiredLeaf path="/gestion-academique/suivi-formations" level="module">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <SuiviFormationsStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SuiviFormationsWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <SuiviFormationsAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SuiviFormationsSurveysTable />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <SuiviFormationsBreakdown />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <SuiviFormationsRunsTable />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
