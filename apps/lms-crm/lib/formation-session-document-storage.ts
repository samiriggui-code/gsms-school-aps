/**
 * Chemins stockage permanents — documents PDF produits par session (suivi formation).
 * Socle MinIO/S3 : `@repo/storage` + gouvernance → Gouvernance données → Storage.
 */
import type { SessionDocumentStorageCategory } from '@repo/storage/constants';
import {
  buildSessionDocumentStoragePrefix,
  SESSION_DOCUMENT_STORAGE_CATEGORIES,
} from '@repo/storage/constants';

export {
  SESSION_DOCUMENT_STORAGE_CATEGORIES,
  buildSessionDocumentStoragePrefix,
  type SessionDocumentStorageCategory,
};

/** Libellés UI pour l’arborescence session (onglet Conformité & archives). */
export const SESSION_DOCUMENT_CATEGORY_LABELS: Record<SessionDocumentStorageCategory, string> = {
  general: 'Documents généraux',
  emargement: 'Feuilles d’émargement (PDF)',
  'suivi-quotidien': 'Suivi quotidien matin / soir',
  conformite: 'Exports financeurs (CPF, France Travail…)',
  examen: 'Documents examen (convocations, jury…)',
  archives: 'Archives légales (copies figées)',
};

/** Visibilité recommandée à l’upload (PDF preuve présence = interne, archives = legal hold via FileAsset). */
export const SESSION_DOCUMENT_CATEGORY_VISIBILITY: Record<
  SessionDocumentStorageCategory,
  'private' | 'internal'
> = {
  general: 'internal',
  emargement: 'internal',
  'suivi-quotidien': 'internal',
  conformite: 'internal',
  examen: 'internal',
  archives: 'private',
};

/** Nom de fichier suggéré pour une feuille d’émargement journalière. */
export function buildEmargementPdfFilename(input: {
  sessionId: string;
  date: Date;
  slot: 'matin' | 'soir' | 'journee';
}): string {
  const ymd = input.date.toISOString().slice(0, 10);
  const slot = input.slot === 'journee' ? 'journee' : input.slot;
  return `emargement-${input.sessionId.slice(0, 8)}-${ymd}-${slot}.pdf`;
}
