'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { useMacOvtSheetContent } from '../content';

export function MacOvtSessionsGrid() {
  const content = useMacOvtSheetContent();
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as {
    subtitle: string;
    layout?: 'compact' | 'grid';
  };

  return (
    <CatalogSessionsPanel
      formationSlug={CATALOG_SLUG.MAC_OVT}
      layout={sessions.layout ?? 'grid'}
      formationSubtitle={sessions.subtitle}
    />
  );
}
