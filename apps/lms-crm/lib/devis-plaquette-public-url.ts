import type { NextRequest } from 'next/server';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';

/** URL absolue de la plaquette « espace client » (jeton en query `t`). */
export function absolutePublicPlaquetteUrl(
  request: Pick<NextRequest, 'headers'>,
  devisId: string,
  token: string,
): string {
  const h = request.headers;
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const origin = `${proto}://${host}`;
  const prefix = nextPublicPathPrefix();
  const tail = `/p/devis/${encodeURIComponent(devisId)}/plaquette`;
  const pathOnly = `${prefix}${tail}`.replace(/\/{2,}/g, '/');
  const qs = `t=${encodeURIComponent(token)}`;
  const path = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return `${origin}${path}?${qs}`;
}
