/** Pièces attendues sur un dossier candidat / stagiaire (champs User + libellés courts). */
export const CANDIDAT_DOCUMENT_FIELDS = [
  { field: 'documentCni' as const, label: 'CNI' },
  { field: 'documentAssurance' as const, label: 'Assurance' },
  { field: 'documentResidencePermit' as const, label: 'Titre séjour' },
  { field: 'avatar' as const, label: 'Photo' },
];

export type CandidatDocumentUser = {
  documentCni?: string | null;
  documentAssurance?: string | null;
  documentResidencePermit?: string | null;
  documentCartePro?: string | null;
  avatar?: string | null;
  residencePermitNumber?: string | null;
};

export function listMissingCandidatDocuments(user: CandidatDocumentUser): string[] {
  const missing: string[] = [];

  for (const doc of CANDIDAT_DOCUMENT_FIELDS) {
    const value = user[doc.field];
    if (!value || !String(value).trim()) {
      if (doc.field === 'documentResidencePermit' && !user.residencePermitNumber?.trim()) {
        continue;
      }
      missing.push(doc.label);
    }
  }

  if (!user.documentCartePro?.trim()) {
    missing.push('Carte pro');
  }

  return missing;
}

export function formatMissingDocumentsLabel(missing: string[]): string {
  if (missing.length === 0) return 'Complet';
  if (missing.length <= 3) return missing.join(', ');
  return `${missing.slice(0, 2).join(', ')} +${missing.length - 2}`;
}

export function buildGedDossierPath(userId: string, displayName: string): string {
  const sp = new URLSearchParams({
    dossierId: userId,
    dossierQ: displayName.trim() || userId,
  });
  return `/securite-configuration/gouvernance-donnees/storage?${sp}`;
}
