import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';

type Params = { params: Promise<{ path?: string[] }> };

/** @deprecated Utiliser `rh/conformite` — redirection interne. */
async function forwardTo(request: NextRequest, targetPath: string) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const url = new URL(request.url);
  const target = `${url.origin}${targetPath}${url.search}`;
  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: request.headers,
    cache: 'no-store',
  };
  if (!['GET', 'HEAD'].includes(method)) {
    init.body = await request.text();
  }
  const response = await fetch(target, init);
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
}

export async function GET(request: NextRequest, { params }: Params) {
  const parts = (await params).path ?? [];
  const id = parts[0];
  if (!id) return fail('Identifiant requis.', 400);
  return forwardTo(request, `/api/sections/gestion-ressources/rh/conformite/${id}`);
}

async function forwardId(request: NextRequest, { params }: Params) {
  const parts = (await params).path ?? [];
  const id = parts[0];
  if (!id) return fail('Identifiant requis.', 400);
  return forwardTo(request, `/api/sections/gestion-ressources/rh/conformite/${id}`);
}

export async function PATCH(request: NextRequest, ctx: Params) {
  return forwardId(request, ctx);
}

export async function PUT(request: NextRequest, ctx: Params) {
  return forwardId(request, ctx);
}
