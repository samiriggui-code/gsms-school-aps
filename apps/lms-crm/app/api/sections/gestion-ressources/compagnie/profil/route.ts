import { NextRequest, NextResponse } from 'next/server';
import { requireGestionRessourcesForMethod } from '../../_lib/require-gestion-ressources-auth';

async function forward(request: NextRequest) {
  const url = new URL(request.url);
  const target = `${url.origin}/api/sections/administration-facturation/tenant/profile${url.search}`;
  const method = request.method.toUpperCase();
  const headers = new Headers(request.headers);

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (!['GET', 'HEAD'].includes(method)) {
    init.body = await request.arrayBuffer();
  }

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

async function withAuth(request: NextRequest) {
  const auth = await requireGestionRessourcesForMethod(request.method);
  if (!auth.ok) return auth.response;
  return forward(request);
}

export async function GET(request: NextRequest) {
  return withAuth(request);
}

export async function HEAD(request: NextRequest) {
  return withAuth(request);
}

export async function POST(request: NextRequest) {
  return withAuth(request);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'GET, HEAD, POST, OPTIONS' },
  });
}
