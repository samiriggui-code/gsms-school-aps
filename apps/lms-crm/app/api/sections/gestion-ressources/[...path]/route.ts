import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';

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

/** Écrans clone CRM hérités (Examens, Plannings, …) → registre collaborateurs. */
const RH_USER_REGISTRY_ALIASES = new Set<string>();

function listFallback(req: NextRequest) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 10);
  return ok({
    items: [],
    pagination: { page, limit, total: 0 },
  });
}

async function forwardTo(
  request: NextRequest,
  targetPath: string,
  sourceFlow?: string,
) {
  const url = new URL(request.url);
  const target = `${url.origin}${targetPath}${url.search}`;
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

  const rhResource = parts[0] === 'rh' ? (parts[1] ?? '') : '';
  if (RH_USER_REGISTRY_ALIASES.has(rhResource)) {
    if (parts.length === 3 && parts[2] === 'stats' && request.method === 'GET') {
      return forwardTo(request, '/api/sections/gestion-ressources/rh/collaborateurs/stats');
    }
    if (parts.length === 2 && (request.method === 'GET' || request.method === 'POST')) {
      return forwardTo(request, '/api/sections/gestion-ressources/rh/collaborateurs');
    }
    if (parts.length >= 3 && !(parts.length === 3 && parts[2] === 'stats')) {
      const sub = parts.slice(2).join('/');
      return forwardTo(
        request,
        `/api/sections/gestion-ressources/rh/collaborateurs/${sub}`,
      );
    }
  }

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

  if (
    joined.startsWith('rh/certifications') ||
    joined.startsWith('partenaires/prestataires') ||
    joined.startsWith('partenaires/compliance') ||
    joined.startsWith('sites/')
  ) {
    if (request.method === 'GET') {
      if (
        joined.endsWith('stats') ||
        joined.endsWith('statistics') ||
        joined.endsWith('metrics')
      ) {
        return ok({});
      }
      return listFallback(request);
    }
    return ok({ migrated: false, endpoint: joined });
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
