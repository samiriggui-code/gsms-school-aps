'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { useSheetContent } from '@/hooks/useSheetContent';

export function CardDate() {
  const content = useSheetContent('landing.sheetContent.tfp');
  const presentation = content.presentation;
  return (
    <CatalogSessionsPanel
      formationSlug={CATALOG_SLUG.TFP_APS}
      layout="compact"
      formationSubtitle={presentation?.title}
    />
  );
}
