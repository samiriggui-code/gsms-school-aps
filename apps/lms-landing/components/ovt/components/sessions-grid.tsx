'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { useOvtSheetContent } from '../content';

export function OvtSessionsGrid() {
  const content = useOvtSheetContent();
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as {
    subtitle: string;
    layout?: 'compact' | 'grid';
  };
  return (
    <CatalogSessionsPanel
      formationSlug={CATALOG_SLUG.OVT}
      layout={sessions.layout ?? 'grid'}
      formationSubtitle={sessions.subtitle}
    />
  );
}
