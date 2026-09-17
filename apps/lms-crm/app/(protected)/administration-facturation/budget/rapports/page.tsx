import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { FinanceRapportsContent } from './components/finance-rapports-content';

export default function Page() {
  return (
    <CrmWiredLeaf path="/administration-facturation/budget/rapports">
      <FinanceRapportsContent />
    </CrmWiredLeaf>
  );
}
