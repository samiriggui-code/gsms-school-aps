'use client';

import Link from 'next/link';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiPageBrief } from '@/components/crm/qualiopi-page-brief';
import {
  QUALIOPI_PAGE_REFERENTIAL,
  listMissingQualiopiPages,
  listPagesForIndicator,
} from '@/lib/of/qualiopi-page-referential';
import { QUALIOPI_INDICATORS_V9 } from '@/lib/of/qualiopi-indicators';
import { useMemo, useState } from 'react';

export default function CartographieFrontPage() {
  const [filter, setFilter] = useState('');
  const [indicator, setIndicator] = useState('');
  const missing = listMissingQualiopiPages();

  const rows = useMemo(() => {
    let list = QUALIOPI_PAGE_REFERENTIAL;
    if (indicator) list = listPagesForIndicator(indicator);
    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.path.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.indicators.some((c) => c.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [filter, indicator]);

  return (
    <CrmWiredLeaf path="/qualiopi/referentiel/cartographie-front" level="leaf">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Référentiel de développement : pour chaque page CRM, quels indicateurs Qualiopi et quelles
          preuves. Les breadcrumbs viennent du menu ; ce panneau guide le contenu à brancher.
        </p>

        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Filtrer path / titre / Q-I…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous les indicateurs</option>
            {QUALIOPI_INDICATORS_V9.map((i) => (
              <option key={i.code} value={i.code}>
                {i.code} — {i.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-rose-950">
            Pages manquantes / stubs à créer ({missing.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {missing.map((m) => (
              <li key={m.path}>
                <Link href={m.path} className="text-primary hover:underline">
                  {m.path}
                </Link>
                <span className="text-muted-foreground"> — {m.title}</span>
                <span className="ml-2 font-mono text-xs text-rose-800">
                  {m.indicators.join(', ')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {rows.map((entry) => (
            <div key={entry.path} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={entry.path} className="font-medium text-foreground hover:underline">
                  {entry.title}
                </Link>
                <code className="text-xs text-muted-foreground">{entry.path}</code>
              </div>
              <QualiopiPageBrief entry={entry} />
            </div>
          ))}
        </div>
      </div>
    </CrmWiredLeaf>
  );
}
