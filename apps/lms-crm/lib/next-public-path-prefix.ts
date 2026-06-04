/**
 * Path prefix derived from NEXT_PUBLIC_BASE_PATH (subdir deploy, e.g. `/app`).
 * If the env value is a full URL, only the pathname is used — never the origin.
 * This keeps same-origin fetches and asset URLs valid on phones (LAN IP) when
 * the template had `http://localhost/...` in NEXT_PUBLIC_BASE_PATH.
 */
export function nextPublicPathPrefix(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? '';
  if (!raw || raw === '/') return '';
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).pathname.replace(/\/$/, '');
    } catch {
      return '';
    }
  }
  return raw.replace(/\/$/, '');
}
