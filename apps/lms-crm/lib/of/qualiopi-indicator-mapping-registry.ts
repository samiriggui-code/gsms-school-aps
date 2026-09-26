/**
 * IndicatorMappingRegistry — Phase 3 du plan Qualiopi (GSMS-OF-05).
 *
 * Classe chaque indicateur V9 en AUTO / HYBRID / MANUAL selon la doctrine du spec §7-10 :
 * AUTO = couvert par une règle déterministe existante (qualiopi-evaluation-rules.ts).
 * MANUAL = jugement humain, pas de proposition agent (ex. I32 — appréciation stratégique).
 * HYBRID = tout le reste : Prisma + documents + Evidence peuvent nourrir une proposition
 *   agent, mais la conformité finale reste une décision humaine (spec §9, §23).
 *
 * Ne remplace pas qualiopi-indicators.ts (source des prismaHints) ni
 * qualiopi-reference-registry.ts (contenu réglementaire) — compose les deux.
 */

import { QUALIOPI_INDICATORS_V9 } from './qualiopi-indicators';

export type QualiopiIndicatorMode = 'AUTO' | 'HYBRID' | 'MANUAL';

export type QualiopiIndicatorMapping = {
  indicator: number;
  code: string;
  mode: QualiopiIndicatorMode;
  /** Modèles Prisma / Evidence pertinents (repris de qualiopi-indicators.ts). */
  entities: string[];
};

/**
 * Indicateurs couverts par une règle déterministe vivante dans qualiopi-evaluation-rules.ts.
 * Tenu à jour manuellement — un ajout de règle doit ajouter son code ici (pas l'inverse).
 */
const AUTO_INDICATORS = new Set([8, 11, 20, 26, 27, 30]);

/**
 * Indicateurs jugés hors périmètre "proposition agent" — appréciation humaine directe.
 * Cf. spec §26 Phase 3, exemple explicite I32.
 */
const MANUAL_INDICATORS = new Set([32]);

function modeFor(indicatorNumber: number): QualiopiIndicatorMode {
  if (AUTO_INDICATORS.has(indicatorNumber)) return 'AUTO';
  if (MANUAL_INDICATORS.has(indicatorNumber)) return 'MANUAL';
  return 'HYBRID';
}

const MAPPING: QualiopiIndicatorMapping[] = QUALIOPI_INDICATORS_V9.map((ind) => ({
  indicator: ind.indicator,
  code: ind.code,
  mode: modeFor(ind.indicator),
  entities: ind.prismaHints ?? [],
}));

export function getIndicatorMapping(indicatorNumber: number): QualiopiIndicatorMapping | undefined {
  return MAPPING.find((m) => m.indicator === indicatorNumber);
}

export function getIndicatorMode(indicatorNumber: number): QualiopiIndicatorMode | undefined {
  return getIndicatorMapping(indicatorNumber)?.mode;
}

export function listByMode(mode: QualiopiIndicatorMode): QualiopiIndicatorMapping[] {
  return MAPPING.filter((m) => m.mode === mode);
}

export function getAllIndicatorMappings(): QualiopiIndicatorMapping[] {
  return MAPPING;
}
