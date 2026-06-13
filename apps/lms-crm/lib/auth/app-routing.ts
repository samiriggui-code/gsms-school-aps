/** Rôles orientés espace candidat / stagiaire. */
export const PORTAL_ROLE_SLUGS = ['candidat', 'eleve'] as const;

/** Rôle portail formateur (pédagogie, sessions assignées). */
export const INSTRUCTOR_ROLE_SLUGS = ['formateur'] as const;

/** Rôles backoffice CRM (hors formateur — espace dédié `/formateur`). */
export const CRM_ROLE_SLUGS = [
  'superadmin',
  'admin',
  'collaborateur',
  'manager',
  'staff',
  'support',
  'formateur',
] as const;

export type PortalRoleSlug = (typeof PORTAL_ROLE_SLUGS)[number];
export type InstructorRoleSlug = (typeof INSTRUCTOR_ROLE_SLUGS)[number];

export function isPortalRole(roleSlug: string | null | undefined): roleSlug is PortalRoleSlug {
  return !!roleSlug && (PORTAL_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

export function isInstructorRole(
  roleSlug: string | null | undefined,
): roleSlug is InstructorRoleSlug {
  return !!roleSlug && (INSTRUCTOR_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

export function isCrmRole(roleSlug: string | null | undefined): boolean {
  return !!roleSlug && (CRM_ROLE_SLUGS as readonly string[]).includes(roleSlug);
}

/** CRM backoffice sans le portail formateur. */
export function isCrmBackofficeRole(roleSlug: string | null | undefined): boolean {
  return isCrmRole(roleSlug) && !isInstructorRole(roleSlug);
}

const PORTAL_PATH_PREFIXES = ['/mon-dossier', '/cnaps', '/formation', '/e-formation', '/apprendre'] as const;
const INSTRUCTOR_PATH_PREFIXES = ['/formateur'] as const;

const CRM_PATH_PREFIXES = [
  '/accueil',
  '/gestion-',
  '/securite-',
  '/communication-',
  '/administration-',
  '/support-',
  '/pilotage-',
  '/mon-profil',
  '/account',
] as const;

function isPortalPath(path: string): boolean {
  return PORTAL_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isCrmPath(path: string): boolean {
  return CRM_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isInstructorPath(path: string): boolean {
  return INSTRUCTOR_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Chemin par défaut après connexion selon le rôle. */
export function getPostLoginPath(roleSlug: string | null | undefined): string {
  if (isPortalRole(roleSlug)) return '/mon-dossier';
  if (isInstructorRole(roleSlug)) return '/formateur';
  return '/accueil';
}

/**
 * Après login : respecte callbackUrl seulement s’il est compatible avec le rôle.
 * Évite qu’un candidat avec callbackUrl=/accueil (cookie CRM) reste bloqué sur le backoffice.
 */
export function resolvePostLoginDestination(
  roleSlug: string | null | undefined,
  callbackUrl: string | null | undefined,
): string {
  const fallback = getPostLoginPath(roleSlug);

  if (!callbackUrl?.startsWith('/')) return fallback;

  const portal = isPortalRole(roleSlug);
  if (portal) {
    if (isCrmPath(callbackUrl) || isInstructorPath(callbackUrl)) return fallback;
    if (isPortalPath(callbackUrl)) return callbackUrl;
    return fallback;
  }

  const instructor = isInstructorRole(roleSlug);
  if (instructor) {
    if (isPortalPath(callbackUrl) || isCrmPath(callbackUrl)) return fallback;
    if (isInstructorPath(callbackUrl)) return callbackUrl;
    return fallback;
  }

  if (isPortalPath(callbackUrl) || isInstructorPath(callbackUrl)) return '/accueil';
  if (isCrmPath(callbackUrl) || callbackUrl === '/signin') return callbackUrl;
  return fallback;
}

/** Lit la session NextAuth côté client (JWT frais après signIn). */
export async function fetchSessionRoleSlug(maxAttempts = 8): Promise<string | null | undefined> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { user?: { roleSlug?: string | null } };
      if (data?.user?.roleSlug) return data.user.roleSlug;
    }
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  return undefined;
}
