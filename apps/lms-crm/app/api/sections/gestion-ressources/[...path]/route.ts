import { NextRequest, NextResponse } from 'next/server';
import { fail } from '@/app/api/_shared/http/response';
import { internalApiOrigin } from '@/lib/internal-api-origin';

type Params = { params: Promise<{ path: string[] }> };

/** Segments après `rh/` : casse insensible (chemins CRM hérités type `Etudiants`, `Examens`). */
const RH_SEGMENT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeGestionRessourcesParts(partsIn: string[]): string[] {
  if (partsIn.length === 0 || partsIn[0] !== 'rh') return partsIn;
  return [
    'rh',
    ...partsIn.slice(1).map((seg) =>
      RH_SEGMENT_UUID.test(seg) ? seg : seg.toLowerCase(),
    ),
  ];
}

async function forwardTo(
  request: NextRequest,
  targetPath: string,
  sourceFlow?: string,
) {
  const url = new URL(request.url);
  const target = `${internalApiOrigin()}${targetPath}${url.search}`;
  const method = request.method.toUpperCase();
  const headers = new Headers(request.headers);

  if (sourceFlow) {
    headers.set('x-lms-source-flow', sourceFlow);
  }

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
    },
  });
}

async function handler(request: NextRequest, { params }: Params) {
  const rawParts = (await params).path || [];
  const parts = normalizeGestionRessourcesParts(rawParts);
  const joined = parts.join('/');

  if (joined === 'rh/collaborateurs') {
    return forwardTo(request, '/api/sections/securite-configuration/acces/users', 'collaborateur');
  }
  if (joined === 'rh/collaborateurs/stats') {
    return forwardTo(request, '/api/sections/gestion-ressources/rh/collaborateurs/stats');
  }
  if (joined.startsWith('rh/collaborateurs/')) {
    const id = parts[2];
    if (id && id !== 'history') {
      return forwardTo(request, `/api/sections/securite-configuration/acces/users/${id}`);
    }
  }

  if (
    parts[0] === 'rh' &&
    parts[1] === 'formationsessions' &&
    parts[3] === 'participants' &&
    parts.length === 4
  ) {
    const sessionId = parts[2];
    const target = `/api/sections/gestion-ressources/rh/formationsessions/${sessionId}/participants`;
    return forwardTo(request, target);
  }

  if (joined === 'tenant/profile/stats') {
    return forwardTo(request, '/api/dashboard/stats');
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
