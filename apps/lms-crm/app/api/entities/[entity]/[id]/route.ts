import { NextRequest } from 'next/server';
import { fail, ok } from '@/app/api/_shared/http/response';
import { protectRoute } from '@/lib/auth/protect-route';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '@/lib/doctype/bootstrap';
import { principalFromSession } from '@/lib/doctype/principal';
import { getResourceService } from '@/lib/doctype/resource';

type Params = { params: Promise<{ entity: string; id: string }> };

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

export async function GET(req: NextRequest, { params }: Params) {
  const { entity, id } = await params;
  const gate = requireRegistry(entity);
  if ('error' in gate) return gate.error;

  const auth = await protectRoute(req, entity, 'GET');
  if (!auth.ok) return auth.response;

  try {
    const row = await getResourceService().get(entity, id, principalFromSession(auth.session));
    if (!row) return fail('Enregistrement introuvable.', 404);
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lecture.';
    const status = message.startsWith('Permission denied') ? 403 : 500;
    return fail(message, status);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { entity, id } = await params;
  const gate = requireRegistry(entity);
  if ('error' in gate) return gate.error;

  const auth = await protectRoute(req, entity, 'PATCH');
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const updated = await getResourceService().update(
      entity,
      id,
      body,
      principalFromSession(auth.session),
    );
    return ok(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur mise à jour.';
    if (message === 'Record not found') return fail(message, 404);
    if (message.startsWith('Permission denied')) return fail(message, 403);
    const status = message.startsWith('Validation') ? 400 : 500;
    return fail(message, status);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { entity, id } = await params;
  const gate = requireRegistry(entity);
  if ('error' in gate) return gate.error;

  const auth = await protectRoute(req, entity, 'DELETE');
  if (!auth.ok) return auth.response;

  try {
    await getResourceService().delete(entity, id, principalFromSession(auth.session));
    return ok({ id, deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur suppression.';
    if (message === 'Record not found') return fail(message, 404);
    if (message.startsWith('Permission denied')) return fail(message, 403);
    return fail(message, 500);
  }
}
