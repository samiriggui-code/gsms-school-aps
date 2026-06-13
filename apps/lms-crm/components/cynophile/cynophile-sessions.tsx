'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { useCynophileSheetContent } from './content';

export function CynophileSessionsGrid() {
  const content = useCynophileSheetContent();
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as {
    subtitle: string;
    layout?: 'compact' | 'grid';
    emptyTitle?: string;
    emptyHint?: string;
  };

  return (
    <CatalogSessionsPanel
      formationSlug={CATALOG_SLUG.ASC_CYNOPHILE}
      layout={sessions.layout ?? 'compact'}
      formationSubtitle={sessions.subtitle}
      emptyTitle={sessions.emptyTitle}
      emptyHint={sessions.emptyHint}
    />
  );
}
