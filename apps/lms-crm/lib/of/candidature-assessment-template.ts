/**
 * Questionnaires WF-02 (analyse du besoin) / WF-03 (positionnement).
 */

import type { CandidatureAssessmentKind } from '@repo/database';

export type AssessmentQuestion = {
  code: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  required: boolean;
  options?: { value: string; label: string }[];
};

export const NEEDS_ANALYSIS_QUESTIONS: AssessmentQuestion[] = [
  { code: 'NA-CONTEXT', label: 'Contexte professionnel actuel', type: 'text', required: true },
  { code: 'NA-OBJECTIVES', label: 'Objectifs de la formation', type: 'text', required: true },
  { code: 'NA-CONSTRAINTS', label: 'Contraintes (horaires, mobilité, santé…)', type: 'text', required: false },
  { code: 'NA-EXPECTATIONS', label: 'Attentes concrètes', type: 'text', required: true },
  { code: 'NA-COMPANY', label: 'Entreprise / employeur (si applicable)', type: 'text', required: false },
  { code: 'NA-FUNDER', label: 'Financeur envisagé', type: 'text', required: false },
  {
    code: 'NA-ADAPTATION',
    label: 'Besoin d’adaptation / aménagement',
    type: 'boolean',
    required: true,
  },
  {
    code: 'NA-ADAPTATION-DETAIL',
    label: 'Précisez le besoin d’adaptation (si oui)',
    type: 'text',
    required: false,
  },
];

export const POSITIONING_QUESTIONS: AssessmentQuestion[] = [
  { code: 'PO-SELF', label: 'Auto-évaluation de votre niveau actuel', type: 'text', required: true },
  { code: 'PO-EXPERIENCE', label: 'Expérience / formations antérieures liées', type: 'text', required: true },
  {
    code: 'PO-LEVEL',
    label: 'Niveau constaté (votre estimation)',
    type: 'select',
    required: true,
    options: [
      { value: 'BEGINNER', label: 'Débutant' },
      { value: 'INTERMEDIATE', label: 'Intermédiaire' },
      { value: 'ADVANCED', label: 'Avancé' },
    ],
  },
  {
    code: 'PO-PREREQ',
    label: 'Prérequis',
    type: 'select',
    required: true,
    options: [
      { value: 'OK', label: 'OK — tous réunis' },
      { value: 'PARTIAL', label: 'Partiels' },
      { value: 'MISSING', label: 'Manquants' },
    ],
  },
  { code: 'PO-NOTES', label: 'Commentaires / points de vigilance', type: 'text', required: false },
];

export function questionsForAssessmentKind(kind: CandidatureAssessmentKind): AssessmentQuestion[] {
  switch (kind) {
    case 'NEEDS_ANALYSIS':
      return NEEDS_ANALYSIS_QUESTIONS;
    case 'POSITIONING':
      return POSITIONING_QUESTIONS;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function parseAdaptationRequired(answers: Record<string, string>): boolean | null {
  const raw = answers['NA-ADAPTATION']?.toString().trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'oui' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'non' || raw === 'no') return false;
  return null;
}
