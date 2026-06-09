'use client';

import { PilotageWorkspacePage } from '@/components/workspace/pilotage-workspace-page';
import { PilotageExportSection } from './pilotage-export-section';

export function PilotageRapportsPage() {
  return (
    <PilotageWorkspacePage
      viewKey="pilotage-rapports"
      afterContent={<PilotageExportSection />}
    />
  );
}
