import { NextRequest } from 'next/server';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';

/**
 * apiFetch - same-origin API calls (paths only; never embeds localhost/LAN host).
 *
 * Usage:
 *   apiFetch('/api/…', { method: 'GET' })
 *   apiFetch('https://external.com/endpoint') // untouched
 */
export async function apiFetch(
  input: string | Request,
  init?: RequestInit,
): Promise<Response> {
  let url: string | Request = input;

  if (typeof input === 'string' && input.startsWith('/api/')) {
    const prefix = nextPublicPathPrefix();
    url = `${prefix}${input}`;
  }

  return fetch(url as RequestInfo, init);
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    //|| request.socket.remoteAddress
    'unknown'
  );
}

/** Développe `{ success: true, data }` renvoyé par les routes `sections/*` ; sinon renvoie le JSON tel quel. */
export function unwrapSectionApiData<T>(payload: unknown): T | undefined {
  if (payload == null || typeof payload !== 'object') return undefined;
  const o = payload as Record<string, unknown>;
  if (o.success === true && 'data' in o) return o.data as T;
  if ('success' in o && o.success === false) return undefined;
  return payload as T;
}
