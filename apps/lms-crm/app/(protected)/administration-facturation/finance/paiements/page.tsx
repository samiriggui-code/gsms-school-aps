import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { FinancePaiementsPageContent } from './components/finance-paiements-page-content';

export default function Page() {
  return (
    <CrmWiredLeaf path="/administration-facturation/finance/paiements">
      <FinancePaiementsPageContent />
    </CrmWiredLeaf>
  );
}
