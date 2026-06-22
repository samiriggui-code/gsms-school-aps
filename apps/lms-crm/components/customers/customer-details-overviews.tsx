'use client';

import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { RecentOrders } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/resent-order';
import { LoyaltyTier } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/loyalty-tier';
import { Statistics1 } from './components/statistics1';

export function CustomerDetailsOverviews({
  catalogSlug,
  preloadedStats,
  presentation,
  loyalty,
}: {
  catalogSlug?: string | null;
  preloadedStats?: {
    hoursDisplay: string;
    traineesDisplay: string;
    priceAmountText: string;
    priceFormatted: string;
    successDisplay: string;
    currency?: string;
  } | null;
  presentation?: FormationSheetViewModel['presentation'];
  loyalty?: FormationSheetViewModel['loyalty'];
}) {
  const catalogCards =
    presentation && loyalty ? (
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <RecentOrders presentation={presentation} />
        <LoyaltyTier loyalty={loyalty} />
      </div>
    ) : null;

  return (
    <div className="space-y-5">
      <Statistics1 catalogSlug={catalogSlug} preloadedStats={preloadedStats} />
      {catalogCards}
    </div>
  );
}
