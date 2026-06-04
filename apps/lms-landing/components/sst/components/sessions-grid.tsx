'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';
import { sstCatalogSlug } from '@/lib/catalog-formation-slugs';
import { SstType } from "../../sst-details-sheet";
import { useSstSheetContent } from '../content';

export function SstSessionsGrid({ type }: { type: SstType }) {
  const content = useSstSheetContent(type);
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as { subtitle: string };

  if (type === 'SST Entreprise') {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] border border-dashed rounded-md bg-accent/10">
        <p className="text-sm font-medium text-foreground">{content.common('sessionsIntra.title')}</p>
        <p className="text-xs text-muted-foreground mt-1">{content.common('sessionsIntra.subtitle')}</p>
      </div>
    );
  }

  return (
    <CatalogSessionsPanel
      formationSlug={sstCatalogSlug(type)}
      layout="compact"
      formationSubtitle={sessions.subtitle}
    />
  );
}
