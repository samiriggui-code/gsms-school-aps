/** Rôles « parcours inscription / formation » : pas de fiche terrain (habilitation, badge planning). */
const PARCOURS_APPRENANT_ROLE_SLUGS = new Set(['candidat', 'eleve']);

export function isParcoursApprenantRole(slug?: string | null): boolean {
  return slug != null && PARCOURS_APPRENANT_ROLE_SLUGS.has(slug);
}

/**
 * Comptes hors parcours inscription (collaborateurs, formateurs, superadmin…) :
 * peuvent avoir contrat RH, carte pro/agrément, catégorie métier `{User.userCategory}`, NIR cotisation…
 */
export function showsUserStaffEmployerFields(roleSlug?: string | null): boolean {
  return !isParcoursApprenantRole(roleSlug);
}

/** Réf. habilitation / agrément, document associé et disponibilité planning (formateurs & collaborateurs métier). */
export function showsCollaboratorAgrementSchedulingSection(roleSlug?: string | null): boolean {
  return !isParcoursApprenantRole(roleSlug);
}

/** Slugs où l’agrément est obligatoire côté conformité « représentation / animation » (dirigeant technique CRM). */
const DIRECTOR_ROLE_SLUGS = new Set(['superadmin']);

export function isFormateurRole(slug?: string | null): boolean {
  return slug === 'formateur';
}

export function isDirectorRole(slug?: string | null): boolean {
  return slug != null && DIRECTOR_ROLE_SLUGS.has(slug);
}

/** Agrément obligatoire à la création (bloc dossier collaborateur hors formateur). */
export function agrementMandatoryForCollaborator(roleSlug?: string | null): boolean {
  return isDirectorRole(roleSlug);
}

export type AgrementUiLabels = {
  sectionTitle: string;
  sectionHint: string;
  numberLabel: string;
  expiryLabel: string;
  documentLabel: string;
};

export function agrementUiLabels(roleSlug?: string | null): AgrementUiLabels {
  if (isFormateurRole(roleSlug)) {
    return {
      sectionTitle: 'Agrément formateur',
      sectionHint:
        'Référence administrative d’animation : nécessaire pour être affecté aux sessions catalogue.',
      numberLabel: 'Référence agrément formateur',
      expiryLabel: "Date de fin de validité de l’agrément",
      documentLabel: "Justificatif d’agrément formateur",
    };
  }
  if (isDirectorRole(roleSlug)) {
    return {
      sectionTitle: 'Agrément dirigeant',
      sectionHint:
        'Représentation habilitée de la structure (distinct du dossier métier terrain des collaborateurs).',
      numberLabel: 'Référence agrément dirigeant',
      expiryLabel: "Date de fin de validité",
      documentLabel: 'Justificatif d’agrément dirigeant',
    };
  }
  return {
    sectionTitle: 'Habilitation / agrément (si applicable)',
    sectionHint:
      'À renseigner lorsqu’une habilitation ou agrément registre existe pour le poste. Laisser vide sinon.',
    numberLabel: 'Référence habilitation ou agrément',
    expiryLabel: 'Date de fin de validité',
    documentLabel: 'Justificatif d’habilitation ou agrément',
  };
}

export function agrementBadgeSuffix(ref: string | null | undefined): string | null {
  const t = ref?.trim();
  if (!t) return null;
  return t.length >= 7 ? t.slice(-7) : t;
}
