'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { useMacApsSheetContent } from '../content';

export function MacApsSessionsGrid() {
  const content = useMacApsSheetContent();
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as {
    subtitle: string;
  };

  return (
    <CatalogSessionsPanel
      formationSlug={CATALOG_SLUG.MAC_APS}
      layout="compact"
      formationSubtitle={sessions.subtitle}
    />
  );
}
