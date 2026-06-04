'use client';

import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { Statistics3 } from './components/statistics3';
import { BillingDetails } from './components/billing-details';
import { PaymentMethods } from './components/payment-methods';

export function CustomerDetailsBilling({ sheetModel }: { sheetModel: FormationSheetViewModel }) {
  const { billingStrip, fundingBlocks, fundingChannels, presentation } = sheetModel;
  return (
    <div className="space-y-5">
      <Statistics3
        price={billingStrip.price}
        cpfLine={billingStrip.cpfLine}
        qualiopiLine={billingStrip.qualiopi}
        financementsLine={billingStrip.financements}
        cpfIsEligible={presentation.cpfEligible}
      />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <BillingDetails fundingBlocks={fundingBlocks} />
        <PaymentMethods channels={fundingChannels} />
      </div>
    </div>
  );
}