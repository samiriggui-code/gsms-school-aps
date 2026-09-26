'use client';

import { useMemo } from 'react';
import { useQualiopiClasseur } from '../hooks/use-qualiopi-classeur';
import { QualiopiClasseurSummary } from './qualiopi-classeur-summary';
import { QualiopiClasseurCriterion } from './qualiopi-classeur-criterion';
import { QualiopiClasseurLoadingState } from './qualiopi-classeur-loading-state';
import { QualiopiClasseurErrorState } from './qualiopi-classeur-error-state';
import type { QualiopiRegistryIndicatorBrief } from '@/lib/of/qualiopi-registry-brief-types';

/** Orchestrateur visuel du classeur Qualiopi — composition uniquement. */
export function QualiopiClasseurView({
  registryByCode = {},
}: {
  registryByCode?: Record<string, QualiopiRegistryIndicatorBrief>;
}) {
  const {
    bootstrapQuery,
    dossierId,
    itemsByCode,
    coveredByCode,
    grouped,
    counts,
    globalOk,
    completenessPct,
    isLoading,
    isError,
  } = useQualiopiClasseur();

  const criteria = useMemo(() => [1, 2, 3, 4, 5, 6, 7] as const, []);

  if (isLoading) {
    return <QualiopiClasseurLoadingState />;
  }

  if (isError || !dossierId) {
    return (
      <QualiopiClasseurErrorState onRetry={() => void bootstrapQuery.refetch()} />
    );
  }

  return (
    <div className="space-y-10">
      <QualiopiClasseurSummary
        counts={counts}
        globalOk={globalOk}
        completenessPct={completenessPct}
      />

      {criteria.map((criterion) => {
        const indicators = grouped.get(criterion);
        if (!indicators?.length) return null;
        return (
          <QualiopiClasseurCriterion
            key={criterion}
            criterion={criterion}
            indicators={indicators}
            itemsByCode={itemsByCode}
            coveredByCode={coveredByCode}
            registryByCode={registryByCode}
          />
        );
      })}
    </div>
  );
}
