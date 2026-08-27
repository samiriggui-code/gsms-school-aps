import type { FormationSessionDaySlot } from '@repo/database';
import type { SessionDocumentStorageCategory } from '@repo/storage/constants';
import { SESSION_DOCUMENT_STORAGE_CATEGORIES } from '@repo/storage/constants';

export const SUIVI_UPLOAD_CATEGORIES = SESSION_DOCUMENT_STORAGE_CATEGORIES;

export type SuiviUploadCategory = SessionDocumentStorageCategory;

export type SuiviDocumentKind =
  | 'session-info'
  | 'convocation'
  | 'convention'
  | 'certificate'
  | 'other'
  | 'signed-scan'
  | 'stamped-scan'
  | 'corrected-scan'
  | 'daily-report'
  | 'pedagogical-notes'
  | 'financeur-proof'
  | 'control-response'
  | 'attendance-proof'
  | 'legal-archive'
  | 'end-of-session-bundle';

export const SESSION_UPLOAD_DOCUMENT_KINDS: Record<
  SuiviUploadCategory,
  Array<{ value: SuiviDocumentKind; label: string; hint?: string }>
> = {
  general: [
    { value: 'session-info', label: 'Information / annexe session' },
    { value: 'convocation', label: 'Convocation ou rappel stagiaires' },
    { value: 'other', label: 'Autre document' },
  ],
  emargement: [
    {
      value: 'signed-scan',
      label: 'Feuille signée (scan)',
      hint: 'Émargement papier signé par les stagiaires en fin de créneau.',
    },
    {
      value: 'stamped-scan',
      label: 'Copie tamponnée / cachet organisme',
      hint: 'Version validée par le centre avec cachet ou signature formateur.',
    },
    {
      value: 'corrected-scan',
      label: 'Feuille corrigée ou complétée',
      hint: 'Remplacement ou complément d’une feuille déjà déposée.',
    },
  ],
  'suivi-quotidien': [
    { value: 'daily-report', label: 'Synthèse journalière' },
    { value: 'pedagogical-notes', label: 'Compte-rendu pédagogique' },
  ],
  conformite: [
    { value: 'financeur-proof', label: 'Justificatif financeur (CPF, FT, entreprise…)' },
    { value: 'control-response', label: 'Réponse contrôle / audit' },
    { value: 'attendance-proof', label: 'Preuve de présence complémentaire' },
  ],
  examen: [
    {
      value: 'convocation',
      label: 'Convocation examen (scan ou copie signée)',
      hint: 'Copie papier remise au stagiaire ou scan de convocation signée.',
    },
    {
      value: 'signed-scan',
      label: 'Émargement examen signé',
      hint: 'Feuille d’émargement examen signée par les candidats le jour J.',
    },
    {
      value: 'attendance-proof',
      label: 'Fiche jury / délibération complétée',
      hint: 'Scan de la grille jury après délibération.',
    },
    { value: 'other', label: 'Autre pièce examen' },
  ],
  convocation: [
    {
      value: 'convocation',
      label: 'Convocation de session (générée ou scan)',
      hint: 'Copie de la convocation envoyée aux participants de cette session.',
    },
    { value: 'other', label: 'Autre pièce liée à la convocation' },
  ],
  convention: [
    {
      value: 'convention',
      label: 'Convention de formation (générée ou signée)',
      hint: 'Copie de la convention établie ou signée pour ce participant.',
    },
    { value: 'other', label: 'Autre pièce liée à la convention' },
  ],
  certificate: [
    {
      value: 'certificate',
      label: 'Certificat de réalisation (généré ou signé)',
      hint: 'Copie du certificat de réalisation délivré à ce participant.',
    },
    { value: 'other', label: 'Autre pièce liée au certificat' },
  ],
  archives: [
    {
      value: 'legal-archive',
      label: 'Archive légale (copie figée)',
      hint: 'Conservation longue durée — non modifiable après dépôt.',
    },
    {
      value: 'end-of-session-bundle',
      label: 'Clôture session — dossier complet',
      hint: 'Regroupement fin de session pour contrôle ou demande d’autorité.',
    },
  ],
};

export const SUIVI_DOCUMENT_KIND_LABELS: Record<SuiviDocumentKind, string> = Object.fromEntries(
  Object.values(SESSION_UPLOAD_DOCUMENT_KINDS)
    .flat()
    .map((k) => [k.value, k.label]),
) as Record<SuiviDocumentKind, string>;

export function isSuiviUploadCategory(value: string): value is SuiviUploadCategory {
  return (SUIVI_UPLOAD_CATEGORIES as readonly string[]).includes(value);
}

export function isSuiviDocumentKind(value: string): value is SuiviDocumentKind {
  return value in SUIVI_DOCUMENT_KIND_LABELS;
}

export function categoryRequiresSessionDay(category: SuiviUploadCategory): boolean {
  return category === 'emargement' || category === 'suivi-quotidien';
}

export function categoryRequiresSlot(category: SuiviUploadCategory, kind: SuiviDocumentKind): boolean {
  return category === 'emargement' && kind !== 'other';
}

export function defaultDocumentKind(category: SuiviUploadCategory): SuiviDocumentKind {
  return SESSION_UPLOAD_DOCUMENT_KINDS[category][0]?.value ?? 'other';
}

export type SuiviDocumentDepositPrefill = {
  category?: SuiviUploadCategory;
  documentKind?: SuiviDocumentKind;
  dayId?: string;
  slot?: 'MORNING' | 'EVENING';
  notes?: string;
};

export function buildSuggestedDocumentTitle(input: {
  category: SuiviUploadCategory;
  documentKind: SuiviDocumentKind;
  dayDateLabel?: string | null;
  slot?: FormationSessionDaySlot | null;
  formationName?: string;
}): string {
  const kindLabel = SUIVI_DOCUMENT_KIND_LABELS[input.documentKind] ?? 'Document';
  const dayPart = input.dayDateLabel ? ` — ${input.dayDateLabel}` : '';
  const slotPart =
    input.slot === 'MORNING'
      ? ' (matin)'
      : input.slot === 'EVENING'
        ? ' (après-midi)'
        : '';
  if (input.category === 'emargement') {
    return `Émargement ${kindLabel.toLowerCase()}${dayPart}${slotPart}`;
  }
  if (input.category === 'archives') {
    return `${kindLabel}${input.formationName ? ` — ${input.formationName}` : ''}`;
  }
  if (input.category === 'examen') {
    return `Examen — ${kindLabel}${input.formationName ? ` (${input.formationName})` : ''}`;
  }
  return `${kindLabel}${dayPart}`;
}

export type SessionDocumentUploadMetadata = {
  sessionId: string;
  storageCategory: SuiviUploadCategory;
  documentKind: SuiviDocumentKind;
  title: string;
  notes: string | null;
  dayId: string | null;
  dayDate: string | null;
  slot: FormationSessionDaySlot | null;
  kind: 'upload';
  source: 'manual-deposit';
  legalHold?: boolean;
  slotRole?: 'template-pdf' | 'signed-scan';
  scanIndex?: number;
};
