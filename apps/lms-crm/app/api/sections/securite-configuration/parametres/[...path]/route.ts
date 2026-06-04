import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ path: string[] }> };

async function forwardTo(request: NextRequest, targetPath: string) {
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
    headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
  });
}

async function handler(request: NextRequest, { params }: Params) {
  const parts = (await params).path || [];
  const joined = parts.join('/');

  if (joined === 'settings') return forwardTo(request, '/api/sections/securite-configuration/acces/settings');
  if (joined === 'settings/general') return forwardTo(request, '/api/sections/securite-configuration/acces/settings/general');
  if (joined === 'settings/notifications') return forwardTo(request, '/api/sections/securite-configuration/acces/settings/notifications');
  if (joined === 'settings/social') return forwardTo(request, '/api/sections/securite-configuration/acces/settings/social');

  return NextResponse.json(
    { success: false, error: { message: 'Endpoint parametres non mappe', endpoint: joined } },
    { status: 501 },
  );
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
