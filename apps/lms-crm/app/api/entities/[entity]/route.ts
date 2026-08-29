import { NextRequest } from 'next/server';
import { fail, ok } from '@/app/api/_shared/http/response';
import { protectRoute } from '@/lib/auth/protect-route';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '@/lib/doctype/bootstrap';
import { principalFromSession } from '@/lib/doctype/principal';
import { getResourceService, listParamsFromRequest } from '@/lib/doctype/resource';

type Params = { params: Promise<{ entity: string }> };

function requireRegistry(entity: string) {
  ensureDocTypeBootstrap();
  if (getDocTypeBootstrapStatus() === 'failed') {
    return { error: fail(getDocTypeBootstrapError() ?? 'DocType bootstrap failed', 503) as ReturnType<typeof fail> };
  }
  const registry = ensureDocTypeBootstrap();
  if (!registry.hasDocType(entity)) {
    return { error: fail('Entité inconnue.', 404) };
  }
  return { registry };
}

/** Shim /api/entities → ResourceService (G1-E: legacy engine removed). */
export async function GET(req: NextRequest, { params }: Params) {
  const { entity } = await params;
  const gate = requireRegistry(entity);
  if ('error' in gate) return gate.error;

  const auth = await protectRoute(req, entity, 'GET');
  if (!auth.ok) return auth.response;

  try {
    const result = await getResourceService().list(
      entity,
      principalFromSession(auth.session),
      listParamsFromRequest(req),
    );
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur liste.';
    const status = message.startsWith('Permission denied') ? 403 : 500;
    return fail(message, status);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { entity } = await params;
  const gate = requireRegistry(entity);
  if ('error' in gate) return gate.error;

  const auth = await protectRoute(req, entity, 'POST');
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const created = await getResourceService().create(
      entity,
      body,
      principalFromSession(auth.session),
    );
    return ok(created, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur création.';
    if (message.startsWith('Permission denied')) return fail(message, 403);
    const status = message.startsWith('Validation') ? 400 : 500;
    return fail(message, status);
  }
}
