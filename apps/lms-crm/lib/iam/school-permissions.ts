/** Préfixes du catalogue permissions école (hors legacy e-commerce). */
export const SCHOOL_PERMISSION_PREFIXES = [
  'crm.',
  'iam.',
  'governance.',
  'lms.',
  'chat.',
  'portal.',
  'in_app_notifications.',
  'settings.',
  'report.',
] as const;

export function schoolPermissionPrismaFilter() {
  return {
    OR: SCHOOL_PERMISSION_PREFIXES.map((prefix) => ({
      slug: { startsWith: prefix },
    })),
  };
}
