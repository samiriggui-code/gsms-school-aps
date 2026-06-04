/** Champs permettant d’afficher une « qualification métier » cohérente en liste (colonnes RH). */

export type QualificationMetierInput = {
  qualification?: string | null;
  jobFunction?: string | null;
  roleSlug?: string | null;
  collaborateurProfile?: {
    qualification?: string | null;
    jobFunction?: string | null;
  } | null;
  formateurProfile?: {
    speciality?: string | null;
    specialties?: unknown;
  } | null;
};

function trim(s: unknown): string {
  if (s == null) return '';
  const t = String(s).trim();
  return t;
}

function uniqNonEmpty(parts: string[]) {
  return Array.from(new Set(parts.map((x) => x.trim()).filter(Boolean)));
}

function specialtiesFromProfile(
  fp: NonNullable<QualificationMetierInput['formateurProfile']>,
): string[] {
  const one = trim(fp.speciality ?? undefined);
  const raw = fp.specialties;
  if (raw == null || raw === '') return one ? [one] : [];
  if (Array.isArray(raw)) return uniqNonEmpty([one, ...raw.map(String)]);
  if (typeof raw === 'string') {
    const str = raw.trim();
    if (!str) return one ? [one] : [];
    try {
      const j = JSON.parse(str);
      if (Array.isArray(j)) return uniqNonEmpty([one, ...j.map(String)]);
    } catch {
      /* ignore */
    }
    return uniqNonEmpty([one, ...str.split(/[,;\n]/)]);
  }
  return one ? [one] : [];
}

/**
 * Valeur lisible pour les DataGrid « Qualification » : User.qualification, profil RH, spécialités formateur,
 * puis fonction / poste si tout le reste est vide.
 */
export function qualificationMetierLabel(input: QualificationMetierInput): string {
  let v = trim(input.qualification ?? undefined);
  if (v) return v;
  v = trim(input.collaborateurProfile?.qualification ?? undefined);
  if (v) return v;
  if (input.roleSlug === 'formateur') {
    const specs = input.formateurProfile
      ? specialtiesFromProfile(input.formateurProfile)
      : [];
    if (specs.length) return specs.join(', ');
  }
  v = trim(input.collaborateurProfile?.jobFunction ?? undefined);
  if (v) return v;
  v = trim(input.jobFunction ?? undefined);
  if (v) return v;
  return '';
}
