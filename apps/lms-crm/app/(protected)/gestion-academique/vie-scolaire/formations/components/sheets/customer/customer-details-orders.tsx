'use client';

import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { Statistics2 } from './components/statistics2';
import { DetailsOrdersTable } from './tables/details-orders';
import { FormationProgramModulesAiPanel } from './formation-program-modules-ai-panel';

export function CustomerDetailsOrders({
  sheetModel,
  formationSlug,
}: {
  sheetModel: FormationSheetViewModel;
  formationSlug: string;
}) {
  const { programStrip, programModules } = sheetModel;
  return (
    <div className="space-y-5">
      <FormationProgramModulesAiPanel formationSlug={formationSlug} />
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