'use client';

import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { Statistics4 } from './components/statistics4';
import { DetailsInvoiceTable } from './tables/details-invoice';

export function CustomerDetailsInvoice({ sheetModel }: { sheetModel: FormationSheetViewModel }) {
  const { prereqStrip, prerequisiteRows } = sheetModel;
  return (
    <div className="space-y-5">
      <Statistics4
        age={prereqStrip.age}
        french={prereqStrip.french}
        auth={prereqStrip.auth}
        casier={prereqStrip.casier}
      />
      <DetailsInvoiceTable rows={prerequisiteRows} />
    </div>
  );
}