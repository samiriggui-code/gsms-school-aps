import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiHubPageClient } from './components/qualiopi-hub-page-client';

/** Section Qualiopi — hub moteur (landing section = dashboard référentiel). */
export default function Page() {
  return (
    <CrmWiredLeaf path="/qualiopi/referentiel" level="module">
      <QualiopiHubPageClient />
    </CrmWiredLeaf>
  );
}
