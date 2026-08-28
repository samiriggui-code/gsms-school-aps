/**
 * Template satisfaction stagiaire — côté app (GSMS-OF-10).
 * Miroir de packages/database/prisma/data/satisfaction-survey-templates.js.
 */

export type SatisfactionScaleValue = '1' | '2' | '3' | '4';

export const SATISFACTION_SCALE: { value: SatisfactionScaleValue; label: string }[] = [
  { value: '1', label: 'Pas satisfait' },
  { value: '2', label: 'Peu satisfait' },
  { value: '3', label: 'Satisfait' },
  { value: '4', label: 'Très satisfait' },
];

export type SatisfactionQuestion = {
  code: string;
  label: string;
  description?: string;
  type: 'text' | 'scale';
  required: boolean;
  timing: 'identity' | 'hot' | 'cold';
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

/** Questions attendues pour un timing d'enquête donné (HOT = identité + à chaud, COLD = à froid uniquement). */
export function questionsForSurveyTiming(timing: 'HOT' | 'COLD'): SatisfactionQuestion[] {
  if (timing === 'COLD') {
    return SATISFACTION_STAGIAIRE_QUESTIONS.filter((q) => q.timing === 'cold');
  }
  return SATISFACTION_STAGIAIRE_QUESTIONS.filter((q) => q.timing === 'identity' || q.timing === 'hot');
}

export const SATISFACTION_TRIGGERS = [
  { when: 'session.end' as const, offsetDays: 0, channel: 'email' as const, label: 'Satisfaction à chaud' },
  { when: 'session.end' as const, offsetDays: 45, channel: 'email' as const, label: 'Satisfaction à froid' },
];
