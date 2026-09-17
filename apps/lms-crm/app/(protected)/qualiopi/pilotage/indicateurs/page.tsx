import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { PilotageIndicateursContent } from '../components/pilotage-indicateurs-content';

export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/pilotage/indicateurs">
      <PilotageIndicateursContent />
    </CrmWiredLeaf>
  );
}
