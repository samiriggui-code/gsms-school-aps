import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ok, fail } from '@/app/api/_shared/http/response';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { internalApiOrigin } from '@/lib/internal-api-origin';

type Params = { params: Promise<{ path: string[] }> };

async function forwardTo(request: NextRequest, targetPath: string) {
  const url = new URL(request.url);
  const target = `${internalApiOrigin()}${targetPath}${url.search}`;
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
    headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
  });
}

async function handler(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const parts = (await params).path || [];
  const joined = parts.join('/');

  // tenant/profile : route dédiée `tenant/profile/route.ts` (évite forward interne + 405).
  if (joined === 'tenant/stats') {
    return forwardTo(request, '/api/dashboard/stats');
  }
  if (joined === 'utilisateurs-roles/logs') {
    return forwardTo(request, '/api/sections/securite-configuration/acces/logs');
  }
  if (joined === 'utilisateurs-roles/users/stats') {
    return forwardTo(request, '/api/dashboard/stats');
  }

  if (request.method === 'GET') {
    return ok([]);
  }

  return fail('Section endpoint not mapped yet', 501, { endpoint: joined });
}

export async function GET(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function POST(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function PUT(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}
