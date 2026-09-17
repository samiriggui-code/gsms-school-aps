import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { PilotageRapportsContent } from '../components/pilotage-rapports-content';

export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/pilotage/rapports">
      <PilotageRapportsContent />
    </CrmWiredLeaf>
  );
}
