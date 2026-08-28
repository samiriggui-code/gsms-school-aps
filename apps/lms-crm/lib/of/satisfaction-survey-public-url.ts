import type { NextRequest } from 'next/server';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';

/** URL absolue de la page publique enquête satisfaction (jeton en query `t`). */
export function absolutePublicSatisfactionSurveyUrl(
  request: Pick<NextRequest, 'headers'>,
  surveyId: string,
  token: string,
): string {
  const h = request.headers;
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const origin = `${proto}://${host}`;
  const prefix = nextPublicPathPrefix();
  const tail = `/p/satisfaction/${encodeURIComponent(surveyId)}`;
  const pathOnly = `${prefix}${tail}`.replace(/\/{2,}/g, '/');
  const qs = `t=${encodeURIComponent(token)}`;
  const path = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return `${origin}${path}?${qs}`;
}
