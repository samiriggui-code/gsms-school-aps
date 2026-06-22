import {
  buildEntityStoragePrefix,
  buildSessionDocumentStoragePrefix,
  ensureEntityStoragePrefix,
  SESSION_DOCUMENT_STORAGE_CATEGORIES,
} from '@repo/storage';

/** Provisionne un préfixe sans faire échouer la route métier. */
export async function provisionStoragePrefixSafe(
  label: string,
  fn: () => Promise<'created' | 'existing'>,
) {
  try {
    await fn();
  } catch (error) {
    console.warn(`[storage] ${label}:`, error);
  }
}

/** Crée le préfixe S3/MinIO pour un utilisateur (`utilisateurs/{userId}/`). */
export async function ensureUserStoragePrefix(userId: string) {
  return ensureEntityStoragePrefix(buildEntityStoragePrefix('utilisateurs', '', userId));
}

/** Crée le préfixe S3/MinIO pour une équipe RH (`rh/equipes/{teamId}/`). */
export async function ensureRhTeamStoragePrefix(teamId: string) {
  return ensureEntityStoragePrefix(buildEntityStoragePrefix('rh', 'equipes', teamId));
}

/** Crée le préfixe S3/MinIO pour une session formation + sous-dossiers suivi (PDF émargement, conformité…). */
export async function ensureSessionSuiviStoragePrefixes(sessionId: string) {
  let created = false;
  const root = buildEntityStoragePrefix('academique', 'sessions', sessionId);
  if ((await ensureEntityStoragePrefix(root)) === 'created') created = true;
  for (const category of SESSION_DOCUMENT_STORAGE_CATEGORIES) {
    const prefix = buildSessionDocumentStoragePrefix(sessionId, category);
    if ((await ensureEntityStoragePrefix(prefix)) === 'created') created = true;
  }
  return created ? ('created' as const) : ('existing' as const);
}

/** Crée le préfixe S3/MinIO pour une session formation (`academique/sessions/{sessionId}/`). */
export async function ensureSessionStoragePrefix(sessionId: string) {
  return ensureSessionSuiviStoragePrefixes(sessionId);
}

/** Crée le préfixe S3/MinIO pour un collaborateur RH (`rh/collaborateurs/{id}/`). */
export async function ensureCollaborateurStoragePrefix(collaborateurId: string) {
  return ensureEntityStoragePrefix(
    buildEntityStoragePrefix('rh', 'collaborateurs', collaborateurId),
  );
}

/** Crée le préfixe S3/MinIO pour un candidat (`rh/candidats/{id}/`). */
export async function ensureCandidatStoragePrefix(candidatId: string) {
  return ensureEntityStoragePrefix(buildEntityStoragePrefix('rh', 'candidats', candidatId));
}
