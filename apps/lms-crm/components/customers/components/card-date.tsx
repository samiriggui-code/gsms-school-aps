'use client';

import { CatalogSessionsPanel } from '@/components/catalog/catalog-sessions-panel';

type Props = {
  formationSlug?: string | null;
  formationSubtitle?: string | null;
};

export function CardDate({ formationSlug, formationSubtitle }: Props) {
  if (!formationSlug?.trim()) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Sélectionnez une formation pour afficher les sessions.
      </p>
    );
  }

  return (
    <CatalogSessionsPanel
      formationSlug={formationSlug.trim()}
      layout="compact"
      formationSubtitle={formationSubtitle ?? undefined}
    />
  );
}
