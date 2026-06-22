import type {
  RhPositionOption,
  SchoolInternalServiceFilter,
} from '@/app/(protected)/gestion-ressources/rh/hooks/use-rh-position-select-query';
import {
  COLLABORATEUR_SERVICES_QUALIFICATION_PRESETS,
  FORMATEUR_TEACHING_SPECIALTY_PRESETS,
  qualificationPresetCatalogForRole,
} from '@/lib/rh-school-profile-fields';
import { isFormateurRole } from '@/lib/rh-agrement';

/** Pôle effectif pour filtrer postes / qualifications (formulaire RH). */
export function resolveRhMetierServiceFilter(
  schoolInternalService: string | null | undefined,
  roleSlug: string | null | undefined,
  userCategory?: string | null,
): SchoolInternalServiceFilter {
  if (
    schoolInternalService === 'DIRECTION' ||
    schoolInternalService === 'PEDAGOGICAL' ||
    schoolInternalService === 'HR_ADMIN' ||
    schoolInternalService === 'TRAINER_POOL'
  ) {
    return schoolInternalService;
  }
  if (isFormateurRole(roleSlug ?? '')) {
    return 'TRAINER_POOL';
  }
  if (userCategory === 'SUBCONTRACTOR') {
    return 'TRAINER_POOL';
  }
  return undefined;
}

/** Évite les doublons de libellé (lignes legacy RhPosition sans code unique). */
export function dedupeRhPositionOptions(rows: RhPositionOption[]): RhPositionOption[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.label.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Catalogue qualifications : API en priorité, repli constantes historiques. */
export function buildQualificationPresetCatalog(
  apiLabels: string[] | undefined,
  roleSlug: string | null | undefined,
  service?: SchoolInternalServiceFilter,
): readonly string[] {
  if (apiLabels?.length) {
    const seen = new Set<string>();
    return apiLabels.filter((label) => {
      const key = label.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (service === 'TRAINER_POOL' || isFormateurRole(roleSlug ?? '')) {
    return FORMATEUR_TEACHING_SPECIALTY_PRESETS;
  }
  if (service === 'DIRECTION' || service === 'PEDAGOGICAL' || service === 'HR_ADMIN') {
    return COLLABORATEUR_SERVICES_QUALIFICATION_PRESETS;
  }
  return qualificationPresetCatalogForRole(roleSlug);
}
