import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiHistoriquePageClient } from '../components/qualiopi-historique-page-client';

export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/referentiel/historique">
      <QualiopiHistoriquePageClient />
    </CrmWiredLeaf>
  );
}
