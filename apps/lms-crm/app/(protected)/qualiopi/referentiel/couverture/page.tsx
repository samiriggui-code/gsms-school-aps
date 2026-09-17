import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiCouverturePageClient } from '../components/qualiopi-couverture-page-client';

export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/referentiel/couverture">
      <QualiopiCouverturePageClient />
    </CrmWiredLeaf>
  );
}
