'use client';

import { Activity, BarChart3, FileText } from 'lucide-react';
import { ModuleLandingWelcomeCallout } from '@/app/(protected)/pilotage-supervision/components/module-landing-welcome-callout';

export function PilotageWelcomeCallout() {
  return (
    <ModuleLandingWelcomeCallout
      moduleLabel="Pilotage"
      description="Alertes opérationnelles, KPI pédagogiques et rapports consolidés — en un seul module."
      icon={Activity}
      links={[
        {
          href: '/qualiopi/pilotage/alertes',
          label: 'Alertes',
          icon: Activity,
        },
        {
          href: '/qualiopi/pilotage/indicateurs',
          label: 'Indicateurs',
          icon: BarChart3,
        },
        {
          href: '/qualiopi/pilotage/rapports',
          label: 'Rapports & exports',
          icon: FileText,
        },
      ]}
    />
  );
}
