'use client';

import Link from 'next/link';
import {
  getQualiopiPageEntry,
  qualiopiIndicatorLabel,
  type QualiopiPageEntry,
  type QualiopiPageRole,
} from '@/lib/of/qualiopi-page-referential';
import type { QualiopiRegistryIndicatorBrief } from '@/lib/of/qualiopi-registry-brief-types';

const ROLE_LABEL: Record<QualiopiPageRole, string> = {
  hub: 'Hub — agrège, ne produit pas la preuve',
  writer: 'Writer — crée / met à jour la preuve métier',
  reader: 'Reader — lit / évalue Qualiopi',
  support: 'Support — contribution indirecte',
  na: 'Hors scope Qualiopi',
};

function RoleBadge({ role }: { role: QualiopiPageRole }) {
  const tones: Record<QualiopiPageRole, string> = {
    hub: 'bg-slate-100 text-slate-800',
    writer: 'bg-emerald-100 text-emerald-900',
    reader: 'bg-sky-100 text-sky-900',
    support: 'bg-amber-100 text-amber-900',
    na: 'bg-zinc-100 text-zinc-600',
  };
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${tones[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function QualiopiPageBrief({
  path,
  entry: entryProp,
  registryIndicators,
  compact = false,
}: {
  path?: string;
  entry?: QualiopiPageEntry;
  /** Contenu V9 (Registry) — chargé côté serveur, passé en props. */
  registryIndicators?: QualiopiRegistryIndicatorBrief[];
  /** Bandeau réduit pour pages writer (details/summary). */
  compact?: boolean;
}) {
  const entry = entryProp ?? (path ? getQualiopiPageEntry(path) : undefined);
  if (!entry) {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-4 text-sm text-amber-950">
        Aucune entrée Qualiopi pour ce path dans le référentiel front. Ajouter dans{' '}
        <code className="text-xs">lib/of/qualiopi-page-referential.ts</code>.
      </div>
    );
  }

  const body = (
    <div className={compact ? 'space-y-3 p-4 text-sm' : 'space-y-4 p-5 text-sm'}>
      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge role={entry.role} />
        {entry.missingInApp ? (
          <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-900">
            Page manquante / hors menu
          </span>
        ) : null}
        {entry.needsStub ? (
          <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
            Stub à développer
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ce que Qualiopi doit retrouver ici
        </h3>
        {entry.mustFind.length === 0 ? (
          <p className="text-muted-foreground">Rien d’attendu (hors RNQ ou hub vide).</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-foreground">
            {entry.mustFind.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      {entry.indicators.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Indicateurs (critère → code)
          </h3>
          <ul className="flex flex-wrap gap-2">
            {entry.indicators.map((code) => (
              <li
                key={code}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                title={qualiopiIndicatorLabel(code)}
              >
                {code}
              </li>
            ))}
          </ul>
          {!registryIndicators?.length ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {entry.indicators.map((c) => qualiopiIndicatorLabel(c)).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}

      {registryIndicators && registryIndicators.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Référentiel V9 (Registry)
          </h3>
          {registryIndicators.map((ind) => (
            <details
              key={ind.code}
              className="rounded-md border border-border bg-background open:bg-muted/20"
            >
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium">
                {ind.code} — I{String(ind.indicatorNumber).padStart(2, '0')} · {ind.label}
                <span className="ml-2 font-normal text-muted-foreground">
                  Critère {ind.criterionNumber}
                </span>
              </summary>
              <div className="space-y-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {ind.expectedLevel ? (
                  <div>
                    <p className="mb-0.5 font-semibold text-foreground">Niveau attendu</p>
                    <p className="whitespace-pre-wrap">{ind.expectedLevel}</p>
                  </div>
                ) : null}
                {ind.evidenceExamples ? (
                  <div>
                    <p className="mb-0.5 font-semibold text-foreground">Exemples de preuves</p>
                    <p className="whitespace-pre-wrap">{ind.evidenceExamples}</p>
                  </div>
                ) : null}
                {ind.nonConformity ? (
                  <div>
                    <p className="mb-0.5 font-semibold text-foreground">Non-conformité</p>
                    <p className="whitespace-pre-wrap">{ind.nonConformity}</p>
                  </div>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      ) : null}

      {entry.evidenceHints.length > 0 ? (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preuves / Prisma
          </h3>
          <p className="font-mono text-xs text-muted-foreground">{entry.evidenceHints.join(' · ')}</p>
        </div>
      ) : null}

      {entry.relatedPaths.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pages liées
          </h3>
          <ul className="flex flex-wrap gap-2">
            {entry.relatedPaths.map((href) => (
              <li key={href}>
                <Link
                  href={href}
                  className="rounded-md border border-border px-2 py-1 text-xs text-primary hover:bg-muted"
                >
                  {href}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {entry.notes ? (
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">{entry.notes}</p>
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <details className="rounded-lg border border-border bg-card open:shadow-sm">
        <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Qualiopi — {entry.title}
          {entry.indicators.length > 0
            ? ` · ${entry.indicators.join(', ')}`
            : ''}
        </summary>
        {body}
      </details>
    );
  }

  return <div className="rounded-lg border border-border bg-card">{body}</div>;
}

/** Page vide de développement : toolbar CrmWiredLeaf + brief Qualiopi. */
export function QualiopiDevStubBody({
  path,
  registryIndicators,
}: {
  path: string;
  registryIndicators?: QualiopiRegistryIndicatorBrief[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Stub de développement — breadcrumbs via le menu ; contenu métier à brancher. Ci-dessous : ce
        que le moteur / l’auditeur doit pouvoir prouver depuis cette page.
      </p>
      <QualiopiPageBrief path={path} registryIndicators={registryIndicators} />
    </div>
  );
}
