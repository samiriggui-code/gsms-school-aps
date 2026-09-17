import { Separator } from '@repo/ui/separator';
import type { QualiopiIndicator } from '@/lib/of/qualiopi-indicators';
import type { ComplianceItemRow } from '../hooks/use-qualiopi-classeur';
import { QualiopiIndicatorCard } from './qualiopi-indicator-card';

export function QualiopiClasseurCriterion({
  criterion,
  indicators,
  itemsByCode,
  coveredByCode,
}: {
  criterion: number;
  indicators: QualiopiIndicator[];
  itemsByCode: Map<string, ComplianceItemRow>;
  coveredByCode: Map<string, boolean>;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
          Critère {criterion}
        </h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {indicators.map((indicator) => (
          <QualiopiIndicatorCard
            key={indicator.code}
            indicator={indicator}
            item={itemsByCode.get(indicator.code)}
            disabled={false}
            evidenceCovered={coveredByCode.get(indicator.code) === true}
          />
        ))}
      </div>
      <Separator className="opacity-40" />
    </section>
  );
}
