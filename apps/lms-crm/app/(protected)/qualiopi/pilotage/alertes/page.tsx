import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { PilotageAlertesPageClient } from './pilotage-alertes-page-client';

export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/pilotage/alertes">
      <PilotageAlertesPageClient />
    </CrmWiredLeaf>
  );
}
