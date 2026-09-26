/** Types partagés Registry brief — OK client (pas de fs). */

export type QualiopiRegistryIndicatorBrief = {
  code: string;
  indicatorNumber: number;
  criterionNumber: number;
  criterionTitle: string;
  label: string;
  expectedLevel?: string;
  evidenceExamples?: string;
  nonConformity?: string;
};
