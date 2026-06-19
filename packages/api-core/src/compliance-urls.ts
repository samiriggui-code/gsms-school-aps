const DEFAULT_SITE = 'http://127.0.0.1:3001';

export function complianceSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.EMAIL_ASSETS_ORIGIN?.trim() ||
    DEFAULT_SITE
  ).replace(/\/$/, '');
}

/** Espace candidat / stagiaire — dépôt documents. */
export function compliancePortalUploadUrl(): string {
  return `${complianceSiteOrigin()}/mon-dossier`;
}

export function complianceGedDossierUrl(userId: string, displayName: string): string {
  const sp = new URLSearchParams({
    dossierId: userId,
    dossierQ: displayName.trim() || userId,
  });
  return `${complianceSiteOrigin()}/securite-configuration/gouvernance-donnees/storage-conformite?${sp}`;
}

export function complianceCandidatureCrmUrl(candidatureId: string): string {
  return `${complianceSiteOrigin()}/gestion-academique/vie-scolaire/etudiants?candidatureId=${candidatureId}`;
}

export function complianceDemandesUrl(): string {
  return `${complianceSiteOrigin()}/securite-configuration/gouvernance-donnees/demandes-documents`;
}

const DOSSIER_KIND_LABELS: Record<string, string> = {
  CANDIDATURE_ADMISSION: 'Dossier admission',
  CANDIDATURE_CNAPS: 'Dossier CNAPS',
  STAGIAIRE_SESSION: 'Dossier stagiaire',
  E_FORMATION_ACCESS: 'Accès e-formation',
  COLLABORATEUR_ONBOARDING: 'Onboarding collaborateur',
  COLLABORATEUR_RH: 'Dossier RH collaborateur',
  FORMATEUR_HABILITATION: 'Habilitation formateur',
  SCHOOL_QUALIOPI: 'Conformité Qualiopi',
  SCHOOL_CNAPS_AGREMENT: 'Agrément CNAPS école',
  SCHOOL_NDA: 'NDA organisme',
};

export function complianceDossierLabel(kind: string): string {
  return DOSSIER_KIND_LABELS[kind] ?? kind;
}

const SUBJECT_TYPE_LABELS: Record<string, string> = {
  USER: 'Utilisateur',
  CANDIDATURE: 'Candidat',
  COLLABORATEUR: 'Collaborateur',
  FORMATEUR: 'Formateur',
  STAGIAIRE: 'Stagiaire',
  SCHOOL: 'Établissement',
  FORMATION: 'Formation',
  SESSION: 'Session',
  E_FORMATION_ENROLLMENT: 'E-formation',
};

export function complianceSubjectTypeLabel(subjectType: string): string {
  return SUBJECT_TYPE_LABELS[subjectType] ?? subjectType;
}

export function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
