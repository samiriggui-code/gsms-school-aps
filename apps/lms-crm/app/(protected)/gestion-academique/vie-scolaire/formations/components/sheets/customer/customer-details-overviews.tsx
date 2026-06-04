'use client';

import type { ReactNode } from 'react';
import type { FormationOverviewMetrics } from './components/statistics1';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { Statistics1 } from './components/statistics1';
import { RecentOrders } from './components/resent-order';
import { LoyaltyTier } from './components/loyalty-tier';

export function CustomerDetailsOverviews({
  formationOverviewMetrics,
  vitrineCards,
  presentation,
  loyalty,
}: {
  /** Si défini (ex. détail catalogue chargé), la rangée métrique reflète la fiche / l’offre au lieu des placeholders démo. */
  formationOverviewMetrics?: FormationOverviewMetrics | null;
  /** Remplace les cartes démo (TFP APS) par du contenu aligné sur une session / fiche réelle. */
  vitrineCards?: ReactNode;
  /** Données vitrine catalogue (onglet vue d’ensemble) lorsque `vitrineCards` n’est pas fourni. */
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
      {/* Jamais `null` : sinon Statistics1 repasse en placeholders démo (ex. 1190 € TFP). */}
      <Statistics1 metrics={formationOverviewMetrics ?? {}} />
      {vitrineCards ?? catalogCards}
    </div>
  );
}
