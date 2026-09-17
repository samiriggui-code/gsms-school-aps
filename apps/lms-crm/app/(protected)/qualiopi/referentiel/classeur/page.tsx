import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiClasseurView } from './components/qualiopi-classeur-view';

export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/referentiel/classeur">
      <QualiopiClasseurView />
    </CrmWiredLeaf>
  );
}
