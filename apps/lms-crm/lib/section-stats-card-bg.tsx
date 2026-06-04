import { toAbsoluteUrl } from '@/lib/helpers';

/** Classe CSS du motif hexagonal sur les cartes KPI des atterrissages section. */
export const SECTION_STATS_CARD_BG_CLASS = 'section-stats-card-bg';

export const SECTION_STATS_CARD_BG_STYLE = `
  .${SECTION_STATS_CARD_BG_CLASS} {
    background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
  }
  .dark .${SECTION_STATS_CARD_BG_CLASS} {
    background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
  }
`;

import { cn } from '@/lib/utils';

const SECTION_KPI_GRID_LG: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
};

/** Grille KPI section alignée sur le nombre de cartes affichées. */
export function sectionLandingStatsGridClass(itemCount: number): string {
  const n = Math.min(Math.max(itemCount, 1), 5) as 1 | 2 | 3 | 4 | 5;
  return cn(
    'grid min-w-0 grid-cols-2 md:grid-cols-3 gap-5 lg:gap-8',
    SECTION_KPI_GRID_LG[n],
  );
}

/** Grille 5 KPI par ligne — raccourci quand la page affiche toujours 5 cartes. */
export const SECTION_LANDING_STATS_GRID_CLASS = sectionLandingStatsGridClass(5);
