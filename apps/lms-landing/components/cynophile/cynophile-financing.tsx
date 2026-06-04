'use client';

import { useEffect, useState } from 'react';
import { Statistics3 } from '@/components/customers/components/statistics3';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { useCynophileSheetContent } from './content';

export function CynophileFinancingStats() {
  const content = useCynophileSheetContent();
  const financing = content.t(`${content.path}.financing`, { returnObjects: true }) as { defaultPrice: string };
  const [priceLabel, setPriceLabel] = useState(financing.defaultPrice);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/catalog/formation?slug=${encodeURIComponent(CATALOG_SLUG.ASC_CYNOPHILE)}`,
          { cache: 'no-store' },
        );
        const json = (await res.json()) as {
          stats: { priceFormatted?: string } | null;
          catalogInactive?: boolean;
        };
        if (
          !cancelled &&
          json.stats?.priceFormatted &&
          !json.catalogInactive
        ) {
          setPriceLabel(json.stats.priceFormatted);
        }
      } catch {
        // Keep i18n default price label.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <Statistics3 price={priceLabel} />;
}
