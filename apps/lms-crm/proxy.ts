import { NextRequest, NextResponse } from 'next/server';

const SKIP_PREFIXES = ['/api', '/_next', '/brand', '/favicon', '/media', '/css', '/docs'];

/** Chemins CRM / auth — pas de redirection SEO landing. */
const CRM_SKIP_PREFIXES = [
  '/signin',
  '/mon-dossier',
  '/cnaps',
  '/formation',
  '/e-formation',
  '/apprendre',
  '/formateur',
  '/accueil',
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
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/apprendre' || pathname.startsWith('/apprendre/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/apprendre/, '/e-formation');
    return NextResponse.redirect(url);
  }

  if (
    pathname === '/' ||
    CRM_SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    SKIP_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.includes('.')
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
