import { NextRequest } from 'next/server';
import { fail, ok } from '@/app/api/_shared/http/response';
import { protectRoute } from '@/lib/auth/protect-route';
import {
  deleteEntity,
  getEntityById,
  updateEntity,
} from '@/lib/framework/engine';
import { getEntityDefinition } from '@/lib/framework/registry';

type Params = { params: Promise<{ entity: string; id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { entity, id } = await params;
  if (!getEntityDefinition(entity)) {
    return fail('Entité inconnue.', 404);
  }

  const auth = await protectRoute(req, entity, 'GET');
  if (!auth.ok) return auth.response;

  try {
    const row = await getEntityById(entity, id, auth.session.user.roleSlug);
    if (!row) return fail('Enregistrement introuvable.', 404);
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lecture.';
    return fail(message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { entity, id } = await params;
  if (!getEntityDefinition(entity)) {
    return fail('Entité inconnue.', 404);
  }

  const auth = await protectRoute(req, entity, 'PATCH');
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const updated = await updateEntity(entity, id, body, {
      userId: auth.userId,
      headers: req.headers,
      roleSlug: auth.session.user.roleSlug,
    });
    return ok(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur mise à jour.';
    if (message === 'Record not found') return fail(message, 404);
    const status = message.startsWith('Validation') ? 400 : 500;
    return fail(message, status);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { entity, id } = await params;
  if (!getEntityDefinition(entity)) {
    return fail('Entité inconnue.', 404);
  }

  const auth = await protectRoute(req, entity, 'DELETE');
  if (!auth.ok) return auth.response;

  try {
    await deleteEntity(entity, id, {
      userId: auth.userId,
      headers: req.headers,
    });
    return ok({ id, deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur suppression.';
    if (message === 'Record not found') return fail(message, 404);
    return fail(message, 500);
  }
}
