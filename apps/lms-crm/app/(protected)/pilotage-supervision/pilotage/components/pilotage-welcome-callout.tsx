'use client';

import { Activity, BarChart3, FileText, ShieldAlert } from 'lucide-react';
import { ModuleLandingWelcomeCallout } from '../../components/module-landing-welcome-callout';

export function PilotageWelcomeCallout() {
  return (
    <ModuleLandingWelcomeCallout
      moduleLabel="Pilotage"
      description="Alertes opérationnelles, KPI pédagogiques, rapports consolidés et registre des risques — en un seul module."
      icon={Activity}
      links={[
        {
          href: '/pilotage-supervision/pilotage/alertes',
          label: 'Alertes',
          icon: Activity,
        },
        {
          href: '/pilotage-supervision/pilotage/indicateurs',
          label: 'Indicateurs',
          icon: BarChart3,
        },
        {
          href: '/pilotage-supervision/pilotage/rapports',
          label: 'Rapports & exports',
          icon: FileText,
        },
        {
          href: '/pilotage-supervision/pilotage/risques',
          label: 'Risques',
          icon: ShieldAlert,
        },
      ]}
    />
  );
}
