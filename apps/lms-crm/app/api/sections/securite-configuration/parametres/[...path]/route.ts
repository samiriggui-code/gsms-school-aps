import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ path: string[] }> };

/** Catch-all réservé aux endpoints parametres non dédiés (settings/* = routes natives). */
async function handler(request: NextRequest, { params }: Params) {
  const parts = (await params).path || [];
  const joined = parts.join('/');

  if (joined.startsWith('settings')) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Utiliser les routes natives parametres/settings/*',
          endpoint: joined,
        },
      },
      { status: 404 },
    );
  }

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
