/** Marqueur immuable — indique que le préfixe socle a été initialisé. */
export const STORAGE_SOCLE_MARKER = '.keep';

/**
 * Arborescence principale (préfixes S3). Les sous-dossiers par id
 * (`utilisateurs/{userId}/`, `rh/equipes/{teamId}/`, …) sont créés à la création des entités.
 */
export const STORAGE_SOCLE_PREFIXES = [
  'ecole',
  'ecole/branding',
  'ecole/conformite',
  'utilisateurs',
  'rh',
  'rh/collaborateurs',
  'rh/equipes',
  'rh/candidats',
  'rh/formateurs',
  'rh/documents',
  'rh/absences',
  'academique',
  'academique/formations',
  'academique/sessions',
  'academique/suivi-formations',
  'academique/stagiaires',
  'academique/certifications',
  'academique/cnaps',
  'academique/planning',
  'finance',
  'finance/devis',
  'finance/factures',
  'finance/exports',
  'finance/paiements',
  'communication',
  'communication/cms',
  'communication/marketing',
  'equipements',
  'equipements/inventaire',
  'equipements/salles',
  'rapports',
  'portail',
  'portail/candidat',
  'portail/formateur',
  'portail/mon-dossier',
  'archives',
  'misc',
  'company/avatars',
] as const;

export type StorageSoclePrefix = (typeof STORAGE_SOCLE_PREFIXES)[number];

/**
 * Routage entityType → arborescence socle (nouveaux uploads).
 * Ex. collaborateur → `rh/collaborateurs/{id}/avatar/`
 */
export const ENTITY_UPLOAD_ROUTES: Record<string, { domain: string; segment: string }> = {
  collaborateur: { domain: 'rh', segment: 'collaborateurs' },
  candidat: { domain: 'rh', segment: 'candidats' },
  formateur: { domain: 'rh', segment: 'formateurs' },
  user: { domain: 'utilisateurs', segment: '' },
  session: { domain: 'academique', segment: 'sessions' },
  stagiaire: { domain: 'academique', segment: 'stagiaires' },
  formation: { domain: 'academique', segment: 'formations' },
  cnaps: { domain: 'academique', segment: 'cnaps' },
  devis: { domain: 'finance', segment: 'devis' },
  facture: { domain: 'finance', segment: 'factures' },
  equipment: { domain: 'equipements', segment: 'inventaire' },
  landing: { domain: 'communication', segment: 'cms' },
};

function sanitizeUploadSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Préfixe métier pour une entité (`rh/collaborateurs/{id}/`). */
export function buildEntityStoragePrefix(
  domain: string,
  entityType: string,
  entityId?: string | null,
): string {
  const base = [domain, entityType].map((s) => s.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
  const id = entityId?.trim();
  return id ? `${base}/${id}` : base;
}

/**
 * Sous-dossiers permanents créés pour chaque `FormationSession` (MinIO/S3 ou local).
 * PDF émargement, synthèses quotidiennes, exports financeurs, copies archivées.
 */
export const SESSION_DOCUMENT_STORAGE_CATEGORIES = [
  'general',
  'emargement',
  'suivi-quotidien',
  'conformite',
  'archives',
] as const;

export type SessionDocumentStorageCategory = (typeof SESSION_DOCUMENT_STORAGE_CATEGORIES)[number];

/** Préfixe complet pour un document PDF de session (`academique/sessions/{id}/emargement/`). */
export function buildSessionDocumentStoragePrefix(
  sessionId: string,
  category: SessionDocumentStorageCategory,
): string {
  return `${buildEntityStoragePrefix('academique', 'sessions', sessionId)}/${category}`;
}

/** Répertoire cible (sans nom de fichier) pour un upload métier. */
export function resolveEntityUploadDir(input: {
  module: string;
  entityType: string;
  entityId?: string | null;
  category?: string | null;
}): string {
  const typeKey = input.entityType.trim().toLowerCase();
  const route = ENTITY_UPLOAD_ROUTES[typeKey];

  if (route) {
    const base = buildEntityStoragePrefix(route.domain, route.segment, input.entityId);
    const category = sanitizeUploadSegment(input.category || 'general');
    return `${base}/${category}`;
  }

  const moduleName = sanitizeUploadSegment(input.module || 'misc');
  const entityType = sanitizeUploadSegment(input.entityType || 'file');
  const entityId = sanitizeUploadSegment(input.entityId || 'unassigned');
  const category = sanitizeUploadSegment(input.category || 'general');
  return `${moduleName}/${entityType}/${entityId}/${category}`;
}
