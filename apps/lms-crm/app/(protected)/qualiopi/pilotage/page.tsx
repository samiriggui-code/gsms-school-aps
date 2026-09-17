import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { PilotageLandingDashboard } from './components/pilotage-landing-dashboard';
import { PilotageStats } from './components/pilotage-stats';
import { PilotageWelcomeCallout } from './components/pilotage-welcome-callout';

export default function PilotageLandingPage() {
  return (
    <CrmWiredLeaf path="/qualiopi/pilotage" level="module">
      <div className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <PilotageStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <PilotageWelcomeCallout />
          </div>
        </div>

        <PilotageLandingDashboard />
      </div>
    </CrmWiredLeaf>
  );
}
