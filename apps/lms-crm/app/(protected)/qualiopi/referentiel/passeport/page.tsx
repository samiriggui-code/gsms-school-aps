import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiPasseportView } from './components/qualiopi-passeport-view';

export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/referentiel/passeport">
      <QualiopiPasseportView />
    </CrmWiredLeaf>
  );
}
