/**
 * Template questionnaire satisfaction stagiaire (échelle 1–4).
 * Source d’idées : export Dolibarr DigiRisk « Questionnaire de satisfaction stagiaire - Evarisk ».
 * Contenu reconstruit pour GSMS-OF-10 — pas de dépendance Dolibarr.
 */

const SATISFACTION_SCALE = [
  { value: '1', label: 'Pas satisfait' },
  { value: '2', label: 'Peu satisfait' },
  { value: '3', label: 'Satisfait' },
  { value: '4', label: 'Très satisfait' },
];

/** @type {{ code: string, label: string, description?: string, type: 'text'|'scale', required?: boolean, timing: 'identity'|'hot'|'cold' }[]} */
const SATISFACTION_STAGIAIRE_QUESTIONS = [
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

const SATISFACTION_STAGIAIRE_TEMPLATE = {
  code: 'SATISFACTION_STAGIAIRE_V1',
  label: 'Questionnaire de satisfaction stagiaire',
  description:
    'Satisfaction à chaud (fin de session) et à froid (J+45) — échelle 1 à 4. Circuit cible : J0 + J+45 (GSMS-OF-10 / NAF-12).',
  scale: SATISFACTION_SCALE,
  questions: SATISFACTION_STAGIAIRE_QUESTIONS,
  /** Déclencheurs déclaratifs (à brancher sur NAF-12 / OF-03). */
  triggers: [
    { when: 'session.end', offsetDays: 0, channel: 'email', label: 'Satisfaction à chaud' },
    { when: 'session.end', offsetDays: 45, channel: 'email', label: 'Satisfaction à froid' },
  ],
};

module.exports = {
  SATISFACTION_SCALE,
  SATISFACTION_STAGIAIRE_QUESTIONS,
  SATISFACTION_STAGIAIRE_TEMPLATE,
};
