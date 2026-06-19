/** Libellés FR pour l’audit documentaire (client + serveur). */

export const DOCUMENT_AUDIT_COMPLIANCE_EVENT_LABELS: Record<string, string> = {
  DOSSIER_CREATED: 'Dossier créé',
  AUTO_EVALUATED: 'Évaluation auto',
  REQUESTED: 'Pièce demandée',
  EMAIL_SENT: 'E-mail envoyé',
  EMAIL_FAILED: 'E-mail en échec',
  VALIDATED: 'Pièce validée',
  REJECTED: 'Pièce rejetée',
  FILE_UPLOADED: 'Fichier déposé',
  REMINDER_SENT: 'Relance envoyée',
  'compliance.document.requested': 'Demande document',
  'compliance.document.expiring': 'Échéance proche',
  'compliance.document.missing': 'Pièce manquante',
  'compliance.dossier.complete': 'Dossier complet',
};

export const DOCUMENT_AUDIT_FILE_EVENT_LABELS: Record<string, string> = {
  FILE_CREATED: 'Fichier créé',
  FILE_ARCHIVED: 'Fichier archivé',
  FILE_DELETED: 'Suppression (corbeille)',
  FILE_VERSIONED: 'Nouvelle version',
};

export const DOCUMENT_AUDIT_EVENT_LABELS: Record<string, string> = {
  ...DOCUMENT_AUDIT_COMPLIANCE_EVENT_LABELS,
  ...DOCUMENT_AUDIT_FILE_EVENT_LABELS,
};

export const DOCUMENT_AUDIT_MODULE_LABELS: Record<string, string> = {
  conformité: 'Conformité',
  'portal-candidat': 'Portail candidat',
  rh: 'Ressources humaines',
  academique: 'Académique',
  crm: 'CRM',
  portail: 'Portail',
  ecole: 'Établissement',
};

export const DOCUMENT_AUDIT_ENTITY_LABELS: Record<string, string> = {
  User: 'Utilisateur',
  USER: 'Utilisateur',
  Collaborateur: 'Collaborateur',
  COLLABORATEUR: 'Collaborateur',
  Formateur: 'Formateur',
  FORMATEUR: 'Formateur',
  STAGIAIRE: 'Stagiaire',
  Stagiaire: 'Stagiaire',
  CANDIDATURE: 'Candidature',
  Candidature: 'Candidature',
  CLIENT: 'Client',
};

export const DOCUMENT_AUDIT_DOSSIER_KIND_LABELS: Record<string, string> = {
  CANDIDATURE_ADMISSION: 'Admission candidat',
  COLLABORATEUR_RH: 'Dossier collaborateur',
  FORMATEUR_AGREMENT: 'Agrément formateur',
  STAGIAIRE_PARCOURS: 'Parcours stagiaire',
};

function humanizeToken(value: string): string {
  return value.replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function labelDocumentAuditEvent(eventType: string): string {
  return DOCUMENT_AUDIT_EVENT_LABELS[eventType] ?? humanizeToken(eventType);
}

export function labelDocumentAuditModule(module: string | null | undefined): string {
  if (!module) return '—';
  return DOCUMENT_AUDIT_MODULE_LABELS[module] ?? humanizeToken(module);
}

export function labelDocumentAuditEntity(entityType: string | null | undefined): string {
  if (!entityType) return '—';
  return DOCUMENT_AUDIT_ENTITY_LABELS[entityType] ?? humanizeToken(entityType);
}

export function labelDocumentAuditDossierKind(kind: string | null | undefined): string {
  if (!kind) return '';
  return DOCUMENT_AUDIT_DOSSIER_KIND_LABELS[kind] ?? humanizeToken(kind);
}
