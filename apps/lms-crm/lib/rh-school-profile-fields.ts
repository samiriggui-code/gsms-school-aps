/** Libellés `UserCategory` pour le contexte école / CRM formations (pas du terrain sécurité). */
export const SCHOOL_USER_CATEGORY_LABELS = {
  INTERNAL: 'Équipe de l’établissement (RH / salariat)',
  CLIENT: 'Apprenant / prospect hors salariat CFA',
  SUBCONTRACTOR: 'Intervenant — partenaire ou sous-traitance',
} as const;

/** Fonctions métier prévues pour les collaborateurs administratifs. */
export const COLLABORATEUR_JOB_FUNCTION_OPTIONS = [
  { value: 'Formateur', label: 'Formateur' },
  { value: 'Direction & pédagogie', label: 'Direction & pédagogie' },
  { value: 'Secrétariat & accueil', label: 'Secrétariat & accueil' },
  { value: 'Administration générale', label: 'Administration générale' },
  { value: 'Comptabilité & finance', label: 'Comptabilité & finance' },
  { value: 'Ressources humaines', label: 'Ressources humaines' },
  { value: 'Marketing & communication', label: 'Marketing & communication' },
  { value: 'IT & systèmes d’information', label: 'IT & systèmes d’information' },
  { value: 'Maintenance & logistique', label: 'Maintenance & logistique' },
] as const;

/** Préréglages récurrents pour les domaines dispensés par un formateur. */
export const FORMATEUR_TEACHING_SPECIALTY_PRESETS = [
  'SST',
  'TFPAPS',
  'Gestes et postures',
  'SSIAP 1',
  'SSIAP 2',
  'SSIAP 3',
  'Incendie & évacuation',
  'EAD / AED',
  'Sauvetage équipes de travail (SECST)',
  'Habilitations électriques',
  'Travail en hauteur',
  'Machines mobiles',
  'Code de la route sécurité',
  'Prévention des risques',
] as const;

/**
 * Qualifications / compétences des salariés des **services de l’établissement** (hors animation catalogue formation).
 * Ne pas confondre avec les domaines techniques formateur (SST, SSIAP…).
 */
export const COLLABORATEUR_SERVICES_QUALIFICATION_PRESETS = [
  'Secrétariat & accueil',
  'Comptabilité & finance',
  'Pédagogie & accompagnement des apprenants',
  'Direction & pilotage',
  'Administration scolaire & dossiers',
  'Ressources humaines',
  'Informatique & support utilisateurs',
  'Communication & relations publiques',
  'Marketing & développement',
  'Qualité & conformité interne',
  'Maintenance & logistique',
  'Relations entreprises & alternance',
  'Juridique & veille réglementaire (établissement)',
] as const;

/** Choix des cases à cocher « qualifications » selon le rôle système. */
export function qualificationPresetCatalogForRole(
  roleSlug: string | null | undefined,
): readonly string[] {
  return roleSlug === 'formateur'
    ? FORMATEUR_TEACHING_SPECIALTY_PRESETS
    : COLLABORATEUR_SERVICES_QUALIFICATION_PRESETS;
}

/** Découpe libellés « a, b, c » tout en retrouvant les préréglages connus (casse tolérée). */
export function parseQualificationTokens(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const parts = raw
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

/** Sépare tokens issus du catalogue SST / Sécu / prévention du reste (texte libre). Ordre cohérent avec la liste de préréglages. */
export function splitQualificationPresetsAndExtra(
  qualification: string | null | undefined,
  teachingSpecialties: string[] | null | undefined,
  presets: readonly string[] = FORMATEUR_TEACHING_SPECIALTY_PRESETS,
): { presetHits: string[]; extraTokens: string[] } {
  const canon = new Map(presets.map((p) => [p.trim().toLowerCase(), p.trim()] as const));
  const merged = [
    ...(teachingSpecialties ?? []).map((t) => t.trim()).filter(Boolean),
    ...parseQualificationTokens(qualification),
  ];
  const hitKeys = new Set<string>();
  for (const tok of merged) {
    const c = canon.get(tok.toLowerCase());
    if (c) hitKeys.add(c);
  }
  const presetHits = presets.map((p) => p.trim()).filter((p) => hitKeys.has(p));
  const extraTokens = Array.from(new Set(merged.filter((tok) => !canon.has(tok.toLowerCase()))));
  return { presetHits, extraTokens };
}

export function combineQualificationFromParts(presetHits: string[], extraLine: string): string {
  const extras = parseQualificationTokens(extraLine);
  return Array.from(new Set([...(presetHits || []).map((s) => s.trim()).filter(Boolean), ...extras])).join(', ');
}
