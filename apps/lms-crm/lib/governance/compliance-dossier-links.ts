/* Inlined depuis @repo/api-core/src/compliance-urls — évite d'importer nodemailer côté client */
function _siteOrigin(): string {
  return (
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL?.trim()) ||
    'http://127.0.0.1:3001'
  ).replace(/\/$/, '');
}

function complianceGedDossierUrl(userId: string, displayName: string): string {
  const sp = new URLSearchParams({ dossierId: userId, dossierQ: displayName.trim() || userId });
  return `${_siteOrigin()}/securite-configuration/gouvernance-donnees/storage?${sp}`;
}

function complianceCandidatureCrmUrl(candidatureId: string): string {
  return `${_siteOrigin()}/gestion-academique/vie-scolaire/etudiants?candidatureId=${candidatureId}`;
}

export function complianceDossierEditPath(input: {
  subjectType: string;
  candidatureId?: string | null;
  userId?: string | null;
  subjectId?: string | null;
  personName?: string;
}): string | null {
  if (input.subjectType === 'CANDIDATURE' && input.candidatureId) {
    return `/gestion-academique/vie-scolaire/etudiants?candidatureId=${input.candidatureId}`;
  }
  if (input.subjectType === 'COLLABORATEUR' || input.subjectType === 'FORMATEUR') {
    const uid = input.userId ?? input.subjectId;
    if (uid) {
      return `/gestion-ressources/rh/collaborateurs?userId=${uid}`;
    }
    return '/gestion-ressources/rh/collaborateurs';
  }
  if (input.subjectType === 'STAGIAIRE' && input.userId) {
    return `/gestion-academique/vie-scolaire/etudiants?userId=${input.userId}`;
  }
  if (input.userId) {
    const sp = new URLSearchParams({
      dossierId: input.userId,
      dossierQ: (input.personName ?? '').trim() || input.userId,
    });
    return `/securite-configuration/gouvernance-donnees/storage?${sp}`;
  }
  return null;
}

export function complianceDossierGedPath(userId: string, displayName: string): string {
  const url = complianceGedDossierUrl(userId, displayName);
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return `/securite-configuration/gouvernance-donnees/storage?dossierId=${userId}`;
  }
}

export function complianceDossierCrmPath(candidatureId: string | null | undefined): string | null {
  if (!candidatureId) return null;
  try {
    const parsed = new URL(complianceCandidatureCrmUrl(candidatureId));
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return `/gestion-academique/vie-scolaire/etudiants?candidatureId=${candidatureId}`;
  }
}
