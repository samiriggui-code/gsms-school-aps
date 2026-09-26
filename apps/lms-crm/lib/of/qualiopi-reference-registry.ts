/**
 * QualiopiReferenceRegistry — GSMS-OF Qualiopi V9.
 *
 * Source de connaissance réglementaire (guide de lecture V9, vendored en Markdown depuis
 * Levier-IA/qualiopi-markdown sous lib/of/qualiopi-reference/v9/). Ni le moteur de règles
 * (qualiopi-evaluation-rules.ts) ni un futur agent IA ne doivent lire ces fichiers directement :
 * ils passent par ce Registry.
 *
 * Server-only (lecture fichiers via node:fs) — ne pas importer depuis un composant client,
 * même règle que qualiopi-indicators.ts pour le .js Prisma.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUALIOPI_INDICATORS_V9, type QualiopiIndicator } from './qualiopi-indicators';

export type QualiopiCriterion = {
  number: number;
  title: string;
  indicators: QualiopiReferenceIndicator[];
};

export type QualiopiReferenceIndicator = {
  indicatorNumber: number;
  criterionNumber: number;
  criterionTitle: string;
  slug: string;
  ponderation: string;
  nouveauxEntrants: boolean;
  sousTraitance: string;
  source: string;
  editorialNote?: string;
  /** Sections Markdown brutes, clé = titre de section H2 (ex. "Énoncé", "Niveau attendu"). */
  sections: Record<string, string>;
  /** Cross-référence avec le référentiel TS existant (code Q-Ixx, prismaHints...), quand disponible. */
  businessRef?: QualiopiIndicator;
};

/**
 * Turbopack/Next peut résoudre `__dirname` vers un faux chemin (ex. C:\ROOT\...).
 * On tente plusieurs racines : module, cwd app, cwd monorepo.
 */
function resolveReferenceDir(): string {
  const cwd = process.cwd();
  let moduleDir: string | undefined;
  try {
    moduleDir = dirname(fileURLToPath(import.meta.url));
  } catch {
    moduleDir = typeof __dirname !== 'undefined' ? __dirname : undefined;
  }

  const candidates = [
    moduleDir ? join(moduleDir, 'qualiopi-reference', 'v9') : null,
    join(cwd, 'lib', 'of', 'qualiopi-reference', 'v9'),
    join(cwd, 'apps', 'lms-crm', 'lib', 'of', 'qualiopi-reference', 'v9'),
  ].filter((p): p is string => Boolean(p));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    `QualiopiReferenceRegistry: dossier v9 introuvable. Essayé : ${candidates.join(' | ')}`,
  );
}

let referenceDirCache: string | null = null;

function getReferenceDir(): string {
  if (referenceDirCache) return referenceDirCache;
  referenceDirCache = resolveReferenceDir();
  return referenceDirCache;
}

function parseFrontMatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const [, frontMatter, body] = match;
  const data: Record<string, string> = {};
  for (const line of frontMatter.split(/\r?\n/)) {
    const lineMatch = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!lineMatch) continue;
    const [, key, rawValue] = lineMatch;
    const trimmed = rawValue.trim();
    data[key] =
      trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed;
  }
  return { data, body };
}

function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = body.split(/^##\s+/m).slice(1);
  for (const part of parts) {
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;
    const heading = part.slice(0, newlineIdx).trim();
    const content = part.slice(newlineIdx + 1).trim();
    sections[heading] = content;
  }
  return sections;
}

function loadIndicatorFile(filename: string): QualiopiReferenceIndicator {
  const raw = readFileSync(join(getReferenceDir(), filename), 'utf-8');
  const { data, body } = parseFrontMatter(raw);
  const indicatorNumber = Number(data.indicateur);
  const businessRef = QUALIOPI_INDICATORS_V9.find((ind) => ind.indicator === indicatorNumber);

  return {
    indicatorNumber,
    criterionNumber: Number(data.critere),
    criterionTitle: data.critere_titre ?? '',
    slug: data.slug ?? '',
    ponderation: data.ponderation ?? '',
    nouveauxEntrants: data.nouveaux_entrants === 'oui',
    sousTraitance: data.sous_traitance ?? '',
    source: data.source ?? '',
    editorialNote: data.editorial_note,
    sections: parseSections(body),
    businessRef,
  };
}

let indicatorsCache: QualiopiReferenceIndicator[] | null = null;

function loadAll(): QualiopiReferenceIndicator[] {
  if (indicatorsCache) return indicatorsCache;
  const dir = getReferenceDir();
  const files = readdirSync(dir).filter((f) => /^\d{2}-.+\.md$/.test(f));
  if (files.length === 0) {
    throw new Error(`QualiopiReferenceRegistry: aucun fichier indicateur trouvé dans ${dir}`);
  }
  indicatorsCache = files
    .map(loadIndicatorFile)
    .sort((a, b) => a.indicatorNumber - b.indicatorNumber);
  return indicatorsCache;
}

export function getIndicator(indicatorNumber: number): QualiopiReferenceIndicator | undefined {
  return loadAll().find((ind) => ind.indicatorNumber === indicatorNumber);
}

export function getCriterion(criterionNumber: number): QualiopiCriterion | undefined {
  const indicators = loadAll().filter((ind) => ind.criterionNumber === criterionNumber);
  if (indicators.length === 0) return undefined;
  return {
    number: criterionNumber,
    title: indicators[0].criterionTitle,
    indicators,
  };
}

export function getAllIndicators(): QualiopiReferenceIndicator[] {
  return loadAll();
}

export function getEvidenceExamples(indicatorNumber: number): string | undefined {
  return getIndicator(indicatorNumber)?.sections['Exemples de preuves'];
}

export function getExpectedLevel(indicatorNumber: number): string | undefined {
  return getIndicator(indicatorNumber)?.sections['Niveau attendu'];
}

export function getNonConformityRules(indicatorNumber: number): string | undefined {
  return getIndicator(indicatorNumber)?.sections['Non-conformité'];
}

export function getApplicableIndicators(context: {
  newEntrant?: boolean;
  subcontractor?: boolean;
}): QualiopiReferenceIndicator[] {
  return loadAll().filter((ind) => {
    if (context.newEntrant === false && ind.nouveauxEntrants) return false;
    if (context.subcontractor === false && ind.sousTraitance === 'applicable') return false;
    return true;
  });
}
