import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import {
  EquipmentStats,
  EquipmentWelcomeCallout,
  EquipmentRecentAffectationsTable,
  EquipmentAlerts,
  EquipmentDistributionChart,
  EquipmentEvolutionChart,
} from './components';

export default function EquipementsLandingPage() {
  return (
    <CrmWiredLeaf path="/gestion-ressources/equipements" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <EquipmentStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <EquipmentWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <EquipmentAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <EquipmentRecentAffectationsTable />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <EquipmentDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <EquipmentEvolutionChart />
          </div>
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
