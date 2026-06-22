/**
 * Email professionnel = identifiant de connexion (username) : prenom.nom@fqdn
 * - Dev : ecole.local
 * - VPS test / client : APP_LOGIN_EMAIL_DOMAIN (FQDN du déploiement)
 *
 * Email personnel (User.email) = envois transactionnels (accès, reset, infos).
 * Rapports / workers / workflows → User.proEmail
 */
const LEGACY_APP_LOGIN_SUFFIXES = ['@ecole.local', '@app.lms.local'];

function normalizeDomain(raw?: string | null): string {
  const value = (
    raw ??
    (typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_APP_LOGIN_EMAIL_DOMAIN ||
        process.env.APP_LOGIN_EMAIL_DOMAIN
      : undefined) ??
    'ecole.local'
  ).trim();
  return value.startsWith('@') ? value.slice(1) : value;
}

export function getAppLoginEmailDomain(): string {
  return normalizeDomain(null);
}

export function buildAppLoginEmail(firstName: string, lastName: string): string {
  const first = firstName.toLowerCase().trim().replace(/\s+/g, '');
  const last = lastName.toLowerCase().trim().replace(/\s+/g, '');
  return `${first}.${last}@${getAppLoginEmailDomain()}`;
}

export function appLoginEmailPatternLabel(): string {
  return `prenom.nom@${getAppLoginEmailDomain()}`;
}

export function isAppLoginEmailAddress(value?: string | null): boolean {
  if (!value?.trim()) return false;
  const e = value.trim().toLowerCase();
  const domain = getAppLoginEmailDomain().toLowerCase();
  if (e.endsWith(`@${domain}`)) return true;
  return LEGACY_APP_LOGIN_SUFFIXES.some((suffix) => e.endsWith(suffix));
}
