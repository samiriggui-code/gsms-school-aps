/**
 * Templates satisfaction — stagiaire (HOT/COLD) + stakeholders WF-28/29/30.
 * Miroir partiel de packages/database/prisma/data/satisfaction-survey-templates.js.
 */

import type { SatisfactionSurveyTiming } from '@repo/database';

export type SatisfactionScaleValue = '1' | '2' | '3' | '4';

export const SATISFACTION_SCALE: { value: SatisfactionScaleValue; label: string }[] = [
  { value: '1', label: 'Pas satisfait' },
  { value: '2', label: 'Peu satisfait' },
  { value: '3', label: 'Satisfait' },
  { value: '4', label: 'Très satisfait' },
];

/** Seuil WF-32 : moyenne des questions scale < ce seuil → alerte. Échelle 1–4. */
export const SATISFACTION_ALERT_THRESHOLD = 3;

export type SatisfactionQuestion = {
  code: string;
  label: string;
  description?: string;
  type: 'text' | 'scale';
  required: boolean;
  timing: 'identity' | 'hot' | 'cold' | 'company' | 'trainer' | 'funder';
};

export const SATISFACTION_STAGIAIRE_QUESTIONS: SatisfactionQuestion[] = [
  { code: 'SAT-FIRSTNAME', label: 'Prénom', type: 'text', required: true, timing: 'identity' },
  { code: 'SAT-LASTNAME', label: 'Nom', type: 'text', required: true, timing: 'identity' },
  { code: 'SAT-COMPANY', label: 'Société', type: 'text', required: true, timing: 'identity' },
  { code: 'SAT-EMAIL', label: 'Adresse e-mail', type: 'text', required: false, timing: 'identity' },
  {
    code: 'SAT-FORMATION-TITLE',
    label: 'L’intitulé de la formation suivie',
    type: 'text',
    required: true,
    timing: 'identity',
  },
  {
    code: 'SAT-START-DATE',
    label: 'La date du premier jour de formation',
    description: 'Date et heure si possible.',
    type: 'text',
    required: true,
    timing: 'identity',
  },
  { code: 'SAT-TRAINER', label: 'Le nom de votre formateur', type: 'text', required: true, timing: 'identity' },
  {
    code: 'SAT-INFO-PREALABLE',
    label: 'Information préalable (convocation, plan d’accès, programme et but de la formation)',
    type: 'scale',
    required: true,
    timing: 'hot',
  },
  { code: 'SAT-ACCUEIL', label: 'Accueil', type: 'scale', required: true, timing: 'hot' },
  { code: 'SAT-ANIMATION', label: 'Animation', type: 'scale', required: true, timing: 'hot' },
  {
    code: 'SAT-SUPPORTS',
    label: 'Moyens et supports pédagogiques',
    type: 'scale',
    required: true,
    timing: 'hot',
  },
  { code: 'SAT-CONTENU', label: 'Contenu de la formation', type: 'scale', required: true, timing: 'hot' },
  {
    code: 'SAT-ECHANGES',
    label: 'Échanges entre les participants',
    type: 'scale',
    required: true,
    timing: 'hot',
  },
  {
    code: 'SAT-ORGANISATION',
    label: 'Organisation matérielle (salle, restaurant)',
    type: 'scale',
    required: true,
    timing: 'hot',
  },
  {
    code: 'SAT-OBJECTIFS',
    label: 'Atteinte des objectifs annoncés',
    type: 'scale',
    required: true,
    timing: 'hot',
  },
  {
    code: 'SAT-RECOMMANDATION',
    label: 'Recommandation de la formation',
    type: 'scale',
    required: true,
    timing: 'cold',
  },
];

/** WF-28 — satisfaction entreprise / commanditaire. */
export const SATISFACTION_COMPANY_QUESTIONS: SatisfactionQuestion[] = [
  {
    code: 'SAT-CO-ORG',
    label: 'Organisation et communication de l’organisme de formation',
    type: 'scale',
    required: true,
    timing: 'company',
  },
  {
    code: 'SAT-CO-OBJECTIFS',
    label: 'Adéquation de la formation aux besoins exprimés',
    type: 'scale',
    required: true,
    timing: 'company',
  },
  {
    code: 'SAT-CO-COMPETENCES',
    label: 'Compétences / professionnalisme du formateur',
    type: 'scale',
    required: true,
    timing: 'company',
  },
  {
    code: 'SAT-CO-RECO',
    label: 'Recommandation de l’organisme pour d’autres collaborateurs',
    type: 'scale',
    required: true,
    timing: 'company',
  },
  {
    code: 'SAT-CO-COMMENT',
    label: 'Commentaires / axes d’amélioration',
    type: 'text',
    required: false,
    timing: 'company',
  },
];

/** WF-29 — satisfaction formateur. */
export const SATISFACTION_TRAINER_QUESTIONS: SatisfactionQuestion[] = [
  {
    code: 'SAT-TR-PREPA',
    label: 'Préparation / informations reçues avant la session',
    type: 'scale',
    required: true,
    timing: 'trainer',
  },
  {
    code: 'SAT-TR-MOYENS',
    label: 'Moyens mis à disposition (salle, matériel, supports)',
    type: 'scale',
    required: true,
    timing: 'trainer',
  },
  {
    code: 'SAT-TR-GROUPE',
    label: 'Composition et dynamique du groupe',
    type: 'scale',
    required: true,
    timing: 'trainer',
  },
  {
    code: 'SAT-TR-SUPPORT',
    label: 'Support de l’organisme pendant la session',
    type: 'scale',
    required: true,
    timing: 'trainer',
  },
  {
    code: 'SAT-TR-COMMENT',
    label: 'Points de vigilance / suggestions',
    type: 'text',
    required: false,
    timing: 'trainer',
  },
];

/** WF-30 — satisfaction financeur. */
export const SATISFACTION_FUNDER_QUESTIONS: SatisfactionQuestion[] = [
  {
    code: 'SAT-FU-DOSSIER',
    label: 'Qualité et exhaustivité du dossier de financement',
    type: 'scale',
    required: true,
    timing: 'funder',
  },
  {
    code: 'SAT-FU-DELAIS',
    label: 'Respect des délais et jalons administratifs',
    type: 'scale',
    required: true,
    timing: 'funder',
  },
  {
    code: 'SAT-FU-JUSTIF',
    label: 'Clarté des justificatifs / preuves de réalisation',
    type: 'scale',
    required: true,
    timing: 'funder',
  },
  {
    code: 'SAT-FU-RECO',
    label: 'Satisfaction globale sur le partenariat',
    type: 'scale',
    required: true,
    timing: 'funder',
  },
  {
    code: 'SAT-FU-COMMENT',
    label: 'Commentaires',
    type: 'text',
    required: false,
    timing: 'funder',
  },
];

const STAKEHOLDER_TIMINGS: SatisfactionSurveyTiming[] = ['COMPANY', 'TRAINER', 'FUNDER'];

export function isStakeholderSurveyTiming(
  timing: SatisfactionSurveyTiming,
): timing is 'COMPANY' | 'TRAINER' | 'FUNDER' {
  return (STAKEHOLDER_TIMINGS as string[]).includes(timing);
}

export function audienceKeyForTiming(
  timing: SatisfactionSurveyTiming,
  participantId?: string | null,
): string {
  if (isStakeholderSurveyTiming(timing)) return timing;
  if (!participantId) throw new Error(`audienceKey requires participantId for timing ${timing}`);
  return participantId;
}

/** Questions attendues pour un timing d'enquête donné. */
export function questionsForSurveyTiming(timing: SatisfactionSurveyTiming): SatisfactionQuestion[] {
  switch (timing) {
    case 'COLD':
      return SATISFACTION_STAGIAIRE_QUESTIONS.filter((q) => q.timing === 'cold');
    case 'HOT':
      return SATISFACTION_STAGIAIRE_QUESTIONS.filter((q) => q.timing === 'identity' || q.timing === 'hot');
    case 'COMPANY':
      return SATISFACTION_COMPANY_QUESTIONS;
    case 'TRAINER':
      return SATISFACTION_TRAINER_QUESTIONS;
    case 'FUNDER':
      return SATISFACTION_FUNDER_QUESTIONS;
    default: {
      const _exhaustive: never = timing;
      return _exhaustive;
    }
  }
}

/** Moyenne des réponses scale (1–4) ; null s’il n’y a aucune note. */
export function averageScaleScore(
  timing: SatisfactionSurveyTiming,
  answers: Record<string, string>,
): number | null {
  const scales = questionsForSurveyTiming(timing).filter((q) => q.type === 'scale');
  const values: number[] = [];
  for (const q of scales) {
    const raw = answers[q.code]?.toString().trim();
    if (!raw) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1 && n <= 4) values.push(n);
  }
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const SATISFACTION_TRIGGERS = [
  { when: 'session.end' as const, offsetDays: 0, channel: 'email' as const, label: 'Satisfaction à chaud' },
  { when: 'session.end' as const, offsetDays: 45, channel: 'email' as const, label: 'Satisfaction à froid' },
];
