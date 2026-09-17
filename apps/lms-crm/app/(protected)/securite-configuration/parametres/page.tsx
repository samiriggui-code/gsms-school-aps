import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { ParametresStats, ParametresWelcomeCallout } from './components';
import { ParametresModuleMenuCards } from './components/parametres-module-menu-cards';
import { ParametresSettingsSectionCards } from './components/parametres-settings-section-cards';

export default function ParametresLandingPage() {
  return (
    <CrmWiredLeaf path="/securite-configuration/parametres" level="module">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 h-full lg:col-span-1">
            <ParametresStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <ParametresWelcomeCallout />
          </div>
        </div>

        <ParametresModuleMenuCards />

        <ParametresSettingsSectionCards />
      </div>
    </CrmWiredLeaf>
  );
}
