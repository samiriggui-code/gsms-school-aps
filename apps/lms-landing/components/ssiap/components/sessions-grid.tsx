'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { ssiapCatalogSlug } from '@/lib/catalog-formation-slugs';
import { SsiapLevel, SsiapType } from "../../ssiap-details-sheet";
import { useSsiapSheetContent } from '../content';

export function SsiapSessionsGrid({ level, type }: { level: SsiapLevel; type: SsiapType }) {
  const content = useSsiapSheetContent(level, type);
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as {
    subtitle: string;
    emptyHint: string;
  };
  const slug = ssiapCatalogSlug(level, type);
  return (
    <CatalogSessionsPanel
      formationSlug={slug}
      layout="compact"
      formationSubtitle={sessions.subtitle}
      emptyHint={sessions.emptyHint}
    />
  );
}
