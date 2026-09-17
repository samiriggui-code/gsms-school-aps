'use client';

import { Fragment, type ComponentType } from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';

/** Forme réelle renvoyée par `StatService.getSectionHubLegacyStats`. */
export type HubSectionStats = {
  totalCollaborators: number;
  activeCollaborators: number;
  absentCollaborators: number;
  complianceRate: number;
  complianceIssues: number;
  categoryDistribution: { name: string; count: number }[];
};

type CardSpec = {
  icon: ComponentType<{ className?: string }>;
  tone: MetricStatTone;
  label: string;
  value: string | number;
  detail: string;
  trend?: 'up' | 'down' | 'neutral';
};

type HubSectionStatsRowProps = {
  data?: HubSectionStats;
  isLoading?: boolean;
  /** Construit les cartes à partir des vraies données — pas de champ inventé. */
  buildCards: (data: HubSectionStats) => CardSpec[];
};

/**
 * Rangée de KPI pleine largeur, générique — remplace les copies par section
 * qui réutilisaient les mêmes libellés RH (availableAgents, activeTeams…)
 * quel que soit le domaine. Chaque section fournit son propre `buildCards`.
 */
export function HubSectionStatsRow({ data, isLoading, buildCards }: HubSectionStatsRowProps) {
  if (isLoading || !data) {
    return (
      <div className={SECTION_LANDING_STATS_GRID_CLASS}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-0 h-full min-h-[120px]">
              <StatCardMetricLayout iconSlot={<Skeleton className="size-12 shrink-0 rounded-lg" />}>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-16" />
              </StatCardMetricLayout>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = buildCards(data);

  return (
    <Fragment>
      <SectionStatsCardBackgroundStyles />
      <div className={SECTION_LANDING_STATS_GRID_CLASS}>
        {cards.map((card, index) => (
          <SectionLandingHexStatCard
            key={index}
            icon={card.icon}
            tone={card.tone}
            label={card.label}
            value={card.value}
            detail={card.detail}
            trend={card.trend ?? 'neutral'}
          />
        ))}
      </div>
    </Fragment>
  );
}
