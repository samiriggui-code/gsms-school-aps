'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { habilitationCatalogSlug } from '@/lib/catalog-formation-slugs';
import { HabType } from "../../habilitation-details-sheet";
import { useHabSheetContent } from '../content';

export function HabSessionsGrid({ type }: { type: HabType }) {
  const content = useHabSheetContent(type);
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as { subtitle: string };

  return (
    <CatalogSessionsPanel
      formationSlug={habilitationCatalogSlug(type)}
      layout="compact"
      formationSubtitle={sessions.subtitle}
    />
  );
}
