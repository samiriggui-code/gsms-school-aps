/**
 * Règles pilotes Qualiopi Q1 — predicates purs sur faits chargés.
 * CODE CALCULE — pas de LLM.
 */

import type {
  QualiopiComplianceFinding,
  QualiopiEvaluationResult,
  QualiopiEvaluationStatus,
  QualiopiFindingSeverity,
} from '@/lib/of/qualiopi-evaluation-types';

export type SessionParticipantFact = {
  id: string;
  userId: string;
  enrollmentStatus: string;
  candidatureId: string | null;
  positioningStatus: string | null;
  formativeCount: number;
  adaptationStatus: string | null;
};

export type SessionEvaluateFacts = {
  sessionId: string;
  sessionLabel: string | null;
  formationName: string;
  readinessStatus: string;
  startDate: Date | null;
  endDate: Date | null;
  participants: SessionParticipantFact[];
  satisfaction: {
    id: string;
    timing: string;
    status: string;
    participantId: string | null;
  }[];
  disabilityReferent: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  subcontractors: { id: string; label: string; status: string }[];
  evidenceRefsByIndicator: Map<string, string[]>;
};

type RuleOutput = {
  evaluation: QualiopiEvaluationResult;
  finding: QualiopiComplianceFinding | null;
};

function severityFor(status: QualiopiEvaluationStatus): QualiopiFindingSeverity {
  switch (status) {
    case 'FAIL':
      return 'critical';
    case 'WARNING':
    case 'NOT_VERIFIABLE':
      return 'warning';
    case 'PASS':
    case 'NOT_APPLICABLE':
      return 'info';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function confirmed(facts: SessionEvaluateFacts): SessionParticipantFact[] {
  return facts.participants.filter((p) => p.enrollmentStatus === 'CONFIRMED');
}

function pack(
  indicatorCode: string,
  label: string,
  scope: QualiopiEvaluationResult['scope'],
  status: QualiopiEvaluationStatus,
  reasonCode: string,
  explanation: string,
  expected: string,
  observed: string,
  evidenceRefs: string[],
  actionTarget: string,
  entityType: string,
  entityId: string | null,
  missingEvidence: string[],
): RuleOutput {
  const evaluation: QualiopiEvaluationResult = {
    indicatorCode,
    label,
    status,
    scope,
    reasonCode,
    explanation,
    expected,
    observed,
    evidenceRefs,
  };

  if (status === 'PASS' || status === 'NOT_APPLICABLE') {
    return { evaluation, finding: null };
  }

  return {
    evaluation,
    finding: {
      indicatorCode,
      status,
      scope,
      entityType,
      entityId,
      reasonCode,
      explanation,
      expected,
      observed,
      missingEvidence,
      actionTarget,
      severity: severityFor(status),
    },
  };
}

/** Q-I08 — positionnement / évaluation des acquis à l’entrée. */
export function ruleQI08Positioning(facts: SessionEvaluateFacts): RuleOutput {
  const code = 'Q-I08';
  const label = 'Positionnement et évaluation des acquis à l’entrée';
  const refs = facts.evidenceRefsByIndicator.get(code) ?? [];
  const action = `/gestion-academique/vie-scolaire/suivi-formations/${facts.sessionId}`;
  const rows = confirmed(facts);

  if (rows.length === 0) {
    return pack(
      code,
      label,
      'SESSION',
      'NOT_VERIFIABLE',
      'NO_CONFIRMED_PARTICIPANTS',
      'Aucun participant confirmé — impossible de conclure sur le positionnement.',
      '≥1 participant confirmé avec positionnement COMPLETED',
      '0 participant confirmé',
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      ['participant.confirmed'],
    );
  }

  const withoutCandidature = rows.filter((p) => !p.candidatureId);
  const completed = rows.filter((p) => p.positioningStatus === 'COMPLETED');
  const sent = rows.filter((p) => p.positioningStatus === 'SENT');
  const expected = `${rows.length}/${rows.length} positionnements COMPLETED`;
  const observed = `${completed.length}/${rows.length} COMPLETED · ${sent.length} SENT · ${withoutCandidature.length} sans candidature`;

  if (completed.length === rows.length) {
    return pack(
      code,
      label,
      'SESSION',
      'PASS',
      'ALL_POSITIONING_COMPLETED',
      'Tous les participants confirmés ont un positionnement complété.',
      expected,
      observed,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      [],
    );
  }

  if (completed.length === 0 && sent.length === 0 && withoutCandidature.length === rows.length) {
    return pack(
      code,
      label,
      'SESSION',
      'NOT_VERIFIABLE',
      'NO_CANDIDATURE_LINK',
      'Participants sans candidature rattachée — positionnement non vérifiable automatiquement.',
      expected,
      observed,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      ['candidatureId', 'POSITIONING assessment'],
    );
  }

  if (completed.length / rows.length >= 0.8 || sent.length > 0) {
    return pack(
      code,
      label,
      'SESSION',
      'WARNING',
      'POSITIONING_INCOMPLETE',
      'Positionnement partiellement couvert — action corrective requise avant audit.',
      expected,
      observed,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      rows
        .filter((p) => p.positioningStatus !== 'COMPLETED')
        .map((p) => `participant:${p.id}:POSITIONING`),
    );
  }

  return pack(
    code,
    label,
    'SESSION',
    'FAIL',
    'POSITIONING_MISSING',
    'Positionnement manquant pour une part significative des bénéficiaires.',
    expected,
    observed,
    refs,
    action,
    'FormationSession',
    facts.sessionId,
    rows
      .filter((p) => p.positioningStatus !== 'COMPLETED')
      .map((p) => `participant:${p.id}:POSITIONING`),
  );
}

/** Q-I11 — évaluation de l’atteinte des objectifs. */
export function ruleQI11Formative(facts: SessionEvaluateFacts): RuleOutput {
  const code = 'Q-I11';
  const label = 'Évaluation de l’atteinte des objectifs';
  const refs = facts.evidenceRefsByIndicator.get(code) ?? [];
  const action = `/gestion-academique/vie-scolaire/suivi-formations/${facts.sessionId}`;
  const rows = confirmed(facts);

  if (rows.length === 0) {
    return pack(
      code,
      label,
      'SESSION',
      'NOT_VERIFIABLE',
      'NO_CONFIRMED_PARTICIPANTS',
      'Aucun participant confirmé — évaluation des objectifs non vérifiable.',
      '≥1 évaluation formative par participant confirmé',
      '0 participant confirmé',
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      ['participant.confirmed'],
    );
  }

  const withEval = rows.filter((p) => p.formativeCount > 0);
  const expected = `${rows.length}/${rows.length} avec ≥1 FormativeAssessment`;
  const observed = `${withEval.length}/${rows.length} couverts`;

  if (withEval.length === rows.length) {
    return pack(
      code,
      label,
      'SESSION',
      'PASS',
      'ALL_FORMATIVE_PRESENT',
      'Chaque participant confirmé a au moins une évaluation formative.',
      expected,
      observed,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      [],
    );
  }

  if (withEval.length / rows.length >= 0.5) {
    return pack(
      code,
      label,
      'SESSION',
      'WARNING',
      'FORMATIVE_PARTIAL',
      'Évaluations formatives partielles sur la session.',
      expected,
      observed,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      rows.filter((p) => p.formativeCount === 0).map((p) => `participant:${p.id}:formative`),
    );
  }

  return pack(
    code,
    label,
    'SESSION',
    'FAIL',
    'FORMATIVE_MISSING',
    'Évaluations formatives absentes pour la majorité des bénéficiaires.',
    expected,
    observed,
    refs,
    action,
    'FormationSession',
    facts.sessionId,
    rows.filter((p) => p.formativeCount === 0).map((p) => `participant:${p.id}:formative`),
  );
}

/** Q-I30 — recueil des appréciations. */
export function ruleQI30Satisfaction(facts: SessionEvaluateFacts): RuleOutput {
  const code = 'Q-I30';
  const label = 'Recueil des appréciations des parties prenantes';
  const refs = facts.evidenceRefsByIndicator.get(code) ?? [];
  const action = `/gestion-academique/vie-scolaire/suivi-formations/${facts.sessionId}`;

  const learnerSurveys = facts.satisfaction.filter(
    (s) => s.timing === 'HOT' || s.timing === 'COLD',
  );
  const completed = learnerSurveys.filter((s) => s.status === 'COMPLETED');
  const sent = learnerSurveys.filter((s) => s.status === 'SENT');
  const expected = '≥1 enquête HOT/COLD COMPLETED (bénéficiaires)';
  const observed = `${completed.length} COMPLETED · ${sent.length} SENT · ${learnerSurveys.length} total HOT/COLD`;

  if (completed.length > 0) {
    return pack(
      code,
      label,
      'SESSION',
      'PASS',
      'SATISFACTION_COMPLETED',
      'Au moins une enquête de satisfaction bénéficiaire est complétée.',
      expected,
      observed,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      [],
    );
  }

  if (sent.length > 0 || learnerSurveys.length > 0) {
    return pack(
      code,
      label,
      'SESSION',
      'WARNING',
      'SATISFACTION_PENDING',
      'Enquêtes présentes mais non complétées — suivi requis.',
      expected,
      observed,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      ['SatisfactionSurvey.COMPLETED'],
    );
  }

  const readiness = facts.readinessStatus;
  if (readiness === 'DRAFT' || readiness === 'PLANNED' || readiness === 'CONFIRMED') {
    return pack(
      code,
      label,
      'SESSION',
      'NOT_APPLICABLE',
      'SESSION_NOT_STARTED',
      'Session pas encore démarrée — satisfaction post-prestation non applicable.',
      expected,
      `readiness=${readiness} · 0 enquête`,
      refs,
      action,
      'FormationSession',
      facts.sessionId,
      [],
    );
  }

  return pack(
    code,
    label,
    'SESSION',
    'FAIL',
    'SATISFACTION_MISSING',
    'Aucune enquête de satisfaction bénéficiaire pour cette session.',
    expected,
    observed,
    refs,
    action,
    'FormationSession',
    facts.sessionId,
    ['SatisfactionSurvey HOT/COLD'],
  );
}

/** Q-I20 — référent handicap (org, hérité session). */
export function ruleQI20DisabilityReferent(facts: SessionEvaluateFacts): RuleOutput {
  const code = 'Q-I20';
  const label = 'Mobilité, référent handicap, conseil de perfectionnement';
  const refs = facts.evidenceRefsByIndicator.get(code) ?? [];
  const action = '/gestion-ressources/rh/referent-handicap';
  const name = facts.disabilityReferent.name?.trim() ?? '';
  const expected = 'SystemSetting.disabilityReferentName renseigné';
  const observed = name
    ? `name=${name} · email=${facts.disabilityReferent.email ?? '—'} · phone=${facts.disabilityReferent.phone ?? '—'}`
    : 'référent non renseigné';

  if (name) {
    return pack(
      code,
      label,
      'ORGANIZATION',
      'PASS',
      'REFERENT_CONFIGURED',
      'Référent handicap configuré au niveau organisme (hérité par la session).',
      expected,
      observed,
      refs,
      action,
      'SystemSetting',
      null,
      [],
    );
  }

  return pack(
    code,
    label,
    'ORGANIZATION',
    'FAIL',
    'REFERENT_MISSING',
    'Référent handicap non configuré — exigence organisme applicable à toute session.',
    expected,
    observed,
    refs,
    action,
    'SystemSetting',
    null,
    ['disabilityReferentName'],
  );
}

/** Q-I26 — accueil / orientation publics handicap. */
export function ruleQI26DisabilityOrientation(facts: SessionEvaluateFacts): RuleOutput {
  const code = 'Q-I26';
  const label = 'Accueil et orientation des publics en situation de handicap';
  const refs = facts.evidenceRefsByIndicator.get(code) ?? [];
  const action = '/gestion-ressources/rh/referent-handicap';
  const name = facts.disabilityReferent.name?.trim() ?? '';
  const pending = confirmed(facts).filter((p) => p.adaptationStatus === 'ADAPTATION_PENDING');

  if (!name) {
    return pack(
      code,
      label,
      'ORGANIZATION',
      'FAIL',
      'REFERENT_MISSING_FOR_I26',
      'Sans référent handicap, l’accueil / orientation n’est pas démontrable.',
      'Référent configuré + adaptations suivies',
      'référent absent',
      refs,
      action,
      'SystemSetting',
      null,
      ['disabilityReferentName'],
    );
  }

  if (pending.length > 0) {
    return pack(
      code,
      label,
      'ORGANIZATION',
      'WARNING',
      'ADAPTATION_PENDING',
      `${pending.length} adaptation(s) en attente sur les participants de la session.`,
      'Adaptations pending = 0',
      `${pending.length} ADAPTATION_PENDING`,
      refs,
      `/gestion-academique/vie-scolaire/suivi-formations/${facts.sessionId}`,
      'FormationSession',
      facts.sessionId,
      pending.map((p) => `participant:${p.id}:adaptation`),
    );
  }

  return pack(
    code,
    label,
    'ORGANIZATION',
    'PASS',
    'DISABILITY_ORIENTATION_OK',
    'Référent configuré ; aucune adaptation en attente sur la session.',
    'Référent OK · adaptations pending = 0',
    `name=${name} · pending=0`,
    refs,
    action,
    'SystemSetting',
    null,
    [],
  );
}

/** Q-I27 — sous-traitance conforme. */
export function ruleQI27Subcontractors(facts: SessionEvaluateFacts): RuleOutput {
  const code = 'Q-I27';
  const label = 'Sous-traitance / portage salarial conforme';
  const refs = facts.evidenceRefsByIndicator.get(code) ?? [];
  const action = '/gestion-ressources/rh/sous-traitants';
  const rows = facts.subcontractors;

  if (rows.length === 0) {
    return pack(
      code,
      label,
      'ORGANIZATION',
      'NOT_APPLICABLE',
      'NO_SUBCONTRACTORS',
      'Aucun sous-traitant enregistré — indicateur non applicable.',
      'Si sous-traitance : statuts APPROVED/ACTIVE',
      '0 SubcontractorRecord',
      refs,
      action,
      'SubcontractorRecord',
      null,
      [],
    );
  }

  const suspended = rows.filter((r) => r.status === 'SUSPENDED');
  const review = rows.filter(
    (r) => r.status === 'REVIEW_REQUIRED' || r.status === 'PENDING_VALIDATION',
  );
  const ok = rows.filter((r) => r.status === 'APPROVED' || r.status === 'ACTIVE');
  const expected = 'Tous les sous-traitants APPROVED ou ACTIVE';
  const observed = `${ok.length} OK · ${review.length} à revoir · ${suspended.length} SUSPENDED / ${rows.length}`;

  if (suspended.length > 0) {
    return pack(
      code,
      label,
      'ORGANIZATION',
      'FAIL',
      'SUBCONTRACTOR_SUSPENDED',
      'Au moins un sous-traitant est suspendu.',
      expected,
      observed,
      refs,
      action,
      'SubcontractorRecord',
      suspended[0]?.id ?? null,
      suspended.map((r) => `subcontractor:${r.id}:SUSPENDED`),
    );
  }

  if (review.length > 0) {
    return pack(
      code,
      label,
      'ORGANIZATION',
      'WARNING',
      'SUBCONTRACTOR_REVIEW',
      'Sous-traitants en attente de validation ou à revoir.',
      expected,
      observed,
      refs,
      action,
      'SubcontractorRecord',
      review[0]?.id ?? null,
      review.map((r) => `subcontractor:${r.id}:${r.status}`),
    );
  }

  return pack(
    code,
    label,
    'ORGANIZATION',
    'PASS',
    'SUBCONTRACTORS_OK',
    'Tous les sous-traitants sont approuvés ou actifs.',
    expected,
    observed,
    refs,
    action,
    'SubcontractorRecord',
    null,
    [],
  );
}

export const QUALIOPI_Q1_PILOT_RULES = [
  ruleQI08Positioning,
  ruleQI11Formative,
  ruleQI30Satisfaction,
  ruleQI20DisabilityReferent,
  ruleQI26DisabilityOrientation,
  ruleQI27Subcontractors,
] as const;
