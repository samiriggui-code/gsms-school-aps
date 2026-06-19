import { NextRequest, NextResponse } from 'next/server';
import { requireGestionRessourcesView } from '../_lib/require-gestion-ressources-auth';
import { internalApiOrigin } from '@/lib/internal-api-origin';

/** Stats bandeau section `/gestion-ressources` — proxy vers le dashboard général. */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const target = `${internalApiOrigin()}/api/dashboard/stats${url.search}`;

  const response = await fetch(target, {
    method: 'GET',
    headers: request.headers,
    cache: 'no-store',
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
}
