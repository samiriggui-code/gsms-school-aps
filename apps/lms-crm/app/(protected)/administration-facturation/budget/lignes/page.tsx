import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { FinanceBudgetPageContent } from './components/finance-budget-page-content';

export default function Page() {
  return (
    <CrmWiredLeaf path="/administration-facturation/budget/lignes">
      <FinanceBudgetPageContent />
    </CrmWiredLeaf>
  );
}
