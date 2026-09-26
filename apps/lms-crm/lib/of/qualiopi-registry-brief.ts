/**
 * Bridge server-only : page-referential → QualiopiReferenceRegistry.
 * Ne pas importer depuis un composant client (lit le MD via fs).
 */

import { getQualiopiPageEntry } from '@/lib/of/qualiopi-page-referential';
import {
  getEvidenceExamples,
  getExpectedLevel,
  getIndicator,
  getNonConformityRules,
} from '@/lib/of/qualiopi-reference-registry';
import type { QualiopiRegistryIndicatorBrief } from '@/lib/of/qualiopi-registry-brief-types';

export type { QualiopiRegistryIndicatorBrief } from '@/lib/of/qualiopi-registry-brief-types';

function truncate(text: string | undefined, max = 480): string | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function codeToNumber(code: string): number | null {
  const m = /^Q-I(\d+)$/i.exec(code.trim());
  if (!m) return null;
  return Number(m[1]);
}

export function buildRegistryBriefForCodes(
  codes: string[],
): QualiopiRegistryIndicatorBrief[] {
  const out: QualiopiRegistryIndicatorBrief[] = [];
  for (const code of codes) {
    const num = codeToNumber(code);
    if (num == null) continue;
    const ind = getIndicator(num);
    if (!ind) continue;
    out.push({
      code,
      indicatorNumber: ind.indicatorNumber,
      criterionNumber: ind.criterionNumber,
      criterionTitle: ind.criterionTitle,
      label: ind.businessRef?.label ?? ind.slug,
      expectedLevel: truncate(getExpectedLevel(num)),
      evidenceExamples: truncate(getEvidenceExamples(num)),
      nonConformity: truncate(getNonConformityRules(num), 360),
    });
  }
  return out;
}

/** Briefs Registry pour une page CRM (codes du page-referential). */
export function buildRegistryBriefForPath(path: string): QualiopiRegistryIndicatorBrief[] {
  const entry = getQualiopiPageEntry(path);
  if (!entry?.indicators.length) return [];
  return buildRegistryBriefForCodes(entry.indicators);
}

/** Map code → brief pour le classeur (32 indicateurs). */
export function buildRegistryBriefMapForAll(): Record<string, QualiopiRegistryIndicatorBrief> {
  const map: Record<string, QualiopiRegistryIndicatorBrief> = {};
  for (let n = 1; n <= 32; n++) {
    const code = `Q-I${String(n).padStart(2, '0')}`;
    const [brief] = buildRegistryBriefForCodes([code]);
    if (brief) map[code] = brief;
  }
  return map;
}
