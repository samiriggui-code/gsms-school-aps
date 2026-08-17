import { NextRequest, NextResponse } from 'next/server';
import { requireGestionRessourcesForMethod } from '../../_lib/require-gestion-ressources-auth';
import { internalApiOrigin } from '@/lib/internal-api-origin';
import { fail } from '@/app/api/_shared/http/response';

async function forwardGet(request: NextRequest) {
  const url = new URL(request.url);
  const target = `${internalApiOrigin()}/api/sections/administration-facturation/tenant/profile${url.search}`;
  const method = request.method.toUpperCase();
  const headers = new Headers(request.headers);

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  const response = await fetch(target, init);
  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
      ...(response.headers.get('allow') ? { allow: response.headers.get('allow')! } : {}),
    },
  });
}

async function withReadAuth(request: NextRequest) {
  const auth = await requireGestionRessourcesForMethod('GET');
  if (!auth.ok) return auth.response;
  return forwardGet(request);
}

/** Lecture seule — les écritures passent par Paramètres système (crm.securite.edit). */
export async function GET(request: NextRequest) {
  return withReadAuth(request);
}

export async function HEAD(request: NextRequest) {
  return withReadAuth(request);
}

export async function POST() {
  return fail(
    'La modification du profil établissement se fait dans Paramètres système → Réglages établissement.',
    403,
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'GET, HEAD, OPTIONS' },
  });
}
