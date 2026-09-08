/**
 * Types du moteur d’évaluation Qualiopi Q1 (déterministe, read-only).
 * Evidence ≠ conformité — une règle produit un statut d’évaluation.
 */

export const QUALIOPI_ENGINE_RULES_VERSION = 'qualiopi-engine-q1.0' as const;

export type QualiopiEvaluationStatus =
  | 'PASS'
  | 'FAIL'
  | 'WARNING'
  | 'NOT_APPLICABLE'
  | 'NOT_VERIFIABLE';

export type QualiopiEvaluationScope =
  | 'ORGANIZATION'
  | 'FORMATION'
  | 'SESSION'
  | 'BENEFICIARY'
  | 'TRAINER'
  | 'SUBCONTRACTOR'
  | 'FUNDING_CASE'
  | 'PROCESS';

export type QualiopiFindingSeverity = 'info' | 'warning' | 'critical';

export type QualiopiEvaluationResult = {
  indicatorCode: string;
  label: string;
  status: QualiopiEvaluationStatus;
  scope: QualiopiEvaluationScope;
  reasonCode: string;
  explanation: string;
  expected: string;
  observed: string;
  evidenceRefs: string[];
};

export type QualiopiComplianceFinding = {
  indicatorCode: string;
  status: QualiopiEvaluationStatus;
  scope: QualiopiEvaluationScope;
  entityType: string;
  entityId: string | null;
  reasonCode: string;
  explanation: string;
  expected: string;
  observed: string;
  missingEvidence: string[];
  actionTarget: string;
  severity: QualiopiFindingSeverity;
};

export type QualiopiEvaluationSummary = {
  pass: number;
  fail: number;
  warning: number;
  notApplicable: number;
  notVerifiable: number;
  total: number;
};

export type QualiopiSessionEvaluatePayload = {
  targetType: 'SESSION';
  targetId: string;
  evaluatedAt: string;
  rulesVersion: typeof QUALIOPI_ENGINE_RULES_VERSION;
  referentialVersion: string;
  session: {
    id: string;
    label: string | null;
    formationName: string;
    readinessStatus: string;
    startDate: string | null;
    endDate: string | null;
    participantCount: number;
  };
  summary: QualiopiEvaluationSummary;
  evaluations: QualiopiEvaluationResult[];
  findings: QualiopiComplianceFinding[];
  disclaimer: string;
};

export class QualiopiSessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`SESSION_NOT_FOUND:${sessionId}`);
    this.name = 'QualiopiSessionNotFoundError';
  }
}
