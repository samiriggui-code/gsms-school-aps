import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SKIP_PREFIXES = ['/_next', '/brand', '/favicon', '/media', '/css'];

/**
 * Pages qui exigent une session (layouts aujourd’hui en useSession client).
 * Filet Edge/Node uniquement — les helpers API (requireCrmApiAuth, portal…)
 * restent la source de vérité pour rôles / permissions.
 */
const SESSION_REQUIRED_PAGE_PREFIXES = [
  '/accueil',
  '/mon-dossier',
  '/cnaps',
  '/formation',
  '/e-formation',
  '/apprendre',
  '/formateur',
  '/communication-contenu',
  '/gestion-academique',
  '/gestion-ressources',
  '/administration-facturation',
  '/gestion-sites-clients',
  '/support-qualite',
  '/pilotage-supervision',
  '/securite-configuration',
  '/mon-profil',
  '/account',
  '/reports',
] as const;

/** API volontairement publiques ou authentifiées autrement qu’avec la session NextAuth. */
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/catalog',
  '/api/preinscriptions',
  '/api/contact',
  '/api/quote-requests',
  '/api/seo',
  '/api/common/health',
  '/api/health',
  '/api/public',
  '/api/internal',
  '/api/landing',
] as const;

/** Pages hors session (token signé, vitrine, auth). */
const PUBLIC_PAGE_PREFIXES = [
  '/signin',
  '/signup',
  '/verify-email',
  '/reset-password',
  '/2fa',
  '/lockscreen',
  '/change-password',
  '/account-deactivated',
  '/docs',
  '/p',
  '/export/official',
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isSessionRequiredPage(pathname: string): boolean {
  if (pathname === '/') return false;
  if (matchesPrefix(pathname, PUBLIC_PAGE_PREFIXES)) return false;
  return matchesPrefix(pathname, SESSION_REQUIRED_PAGE_PREFIXES);
}

function isSessionRequiredApi(pathname: string): boolean {
  if (!pathname.startsWith('/api')) return false;
  if (matchesPrefix(pathname, PUBLIC_API_PREFIXES)) return false;
  return true;
}

async function hasSessionToken(request: NextRequest): Promise<boolean> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // Sans secret, getToken ne peut pas valider — fail-closed.
    return false;
  }
  const token = await getToken({
    req: request,
    secret,
  });
  return Boolean(token);
}

function unauthorizedApi(): NextResponse {
  return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
}

function redirectToSignin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/signin';
  url.search = '';
  const callback = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (callback && callback !== '/signin') {
    url.searchParams.set('callbackUrl', callback);
  }
  return NextResponse.redirect(url);
}

/**
 * Next.js 16 : convention `proxy.ts` (remplace middleware.ts).
 * 1) Filet session pour pages/API protégées
 * 2) Redirect /apprendre → /e-formation
 * 3) Redirections SEO landing
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    SKIP_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (isSessionRequiredApi(pathname)) {
    if (!(await hasSessionToken(request))) {
      return unauthorizedApi();
    }
  } else if (isSessionRequiredPage(pathname)) {
    if (!(await hasSessionToken(request))) {
      return redirectToSignin(request);
    }
  }

  if (pathname === '/apprendre' || pathname.startsWith('/apprendre/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/apprendre/, '/e-formation');
    return NextResponse.redirect(url);
  }

  if (pathname === '/account' || pathname.startsWith('/account/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/account/, '/mon-profil');
    return NextResponse.redirect(url);
  }

  if (
    pathname === '/' ||
    matchesPrefix(pathname, SESSION_REQUIRED_PAGE_PREFIXES) ||
    matchesPrefix(pathname, PUBLIC_PAGE_PREFIXES) ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/brand') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/css')
  ) {
    return NextResponse.next();
  }

  // Redirections SEO sur chemins simples (/catalogue, /contact, …)
  if (!/^\/[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  try {
    const resolveUrl = new URL(`/api/seo/redirect?path=${encodeURIComponent(pathname)}`, request.url);
    const res = await fetch(resolveUrl, { cache: 'no-store' });
    if (!res.ok) return NextResponse.next();

    const data = (await res.json()) as { target?: string | null; type?: number };
    if (!data.target) return NextResponse.next();

    const status = data.type === 301 ? 301 : 302;

    if (data.target.startsWith('/#')) {
      const dest = request.nextUrl.clone();
      dest.pathname = '/';
      dest.hash = data.target.slice(2);
      dest.search = '';
      return NextResponse.redirect(dest, status);
    }

    return NextResponse.redirect(new URL(data.target, request.url), status);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
