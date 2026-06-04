import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const target = `${url.origin}/api/health${url.search}`;
  const response = await fetch(target, { method: 'GET', cache: 'no-store' });
  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
}
