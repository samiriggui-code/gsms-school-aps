'use client';

import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { Statistics2 } from './components/statistics2';
import { DetailsOrdersTable } from './tables/details-orders';

export function CustomerDetailsOrders({ sheetModel }: { sheetModel: FormationSheetViewModel }) {
  const { programStrip, programModules } = sheetModel;
  return (
    <div className="space-y-5">
      <Statistics2
        uvCount={programStrip.uvCount}
        volumeLabel={programStrip.volume}
        theoryLabel={programStrip.theory}
        practiceLabel={programStrip.practice}
      />
      <DetailsOrdersTable programModules={programModules} />
    </div>
  );
}