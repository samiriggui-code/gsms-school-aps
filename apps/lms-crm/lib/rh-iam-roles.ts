/** Rôles IAM métier école (CRM + portails). */
export const SCHOOL_IAM_ROLE_SLUGS = [
  'superadmin',
  'admin',
  'collaborateur',
  'formateur',
  'candidat',
  'eleve',
] as const;

export type SchoolIamRoleSlug = (typeof SCHOOL_IAM_ROLE_SLUGS)[number];

/** Rôles Metronic / e-commerce à exclure des sélecteurs RH. */
export const LEGACY_METRONIC_ROLE_SLUGS = [
  'vendor',
  'customer',
  'guest',
  'manager',
  'staff',
  'support',
  'member',
  'owner',
] as const;

/** Permission portail / app mobile (formateur, apprenant, collaborateur terrain). */
export const PORTAL_MOBILE_ACCESS_PERMISSION = 'portal.mobile.access';

export function isSchoolIamRoleSlug(slug: string | null | undefined): slug is SchoolIamRoleSlug {
  if (!slug) return false;
  return (SCHOOL_IAM_ROLE_SLUGS as readonly string[]).includes(slug);
}

export function roleHasMobilePortalAccess(
  role:
    | {
        slug?: string | null;
        permissions?:
          | { slug?: string | null; permission?: { slug?: string } | null }[]
          | null;
      }
    | null
    | undefined,
): boolean {
  if (!role) return false;
  const slugs = new Set<string>();
  for (const rp of role.permissions ?? []) {
    const s =
      typeof rp === 'object' && rp !== null && 'permission' in rp
        ? (rp.permission?.slug ?? (rp as { slug?: string }).slug)
        : (rp as { slug?: string }).slug;
    if (s) slugs.add(s);
  }
  if (slugs.has(PORTAL_MOBILE_ACCESS_PERMISSION)) return true;
  return ['formateur', 'candidat', 'eleve', 'collaborateur'].includes(role.slug ?? '');
}
