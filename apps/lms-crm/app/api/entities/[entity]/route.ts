import { NextRequest } from 'next/server';
import { fail, ok } from '@/app/api/_shared/http/response';
import { protectRoute } from '@/lib/auth/protect-route';
import { createEntity, listEntity } from '@/lib/framework/engine';
import { getEntityDefinition } from '@/lib/framework/registry';

type Params = { params: Promise<{ entity: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { entity } = await params;
  if (!getEntityDefinition(entity)) {
    return fail('Entité inconnue.', 404);
  }

  const auth = await protectRoute(req, entity, 'GET');
  if (!auth.ok) return auth.response;

  try {
    const result = await listEntity(
      entity,
      { searchParams: new URL(req.url).searchParams, headers: req.headers },
      auth.session.user.roleSlug,
    );
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur liste.';
    return fail(message, 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { entity } = await params;
  if (!getEntityDefinition(entity)) {
    return fail('Entité inconnue.', 404);
  }

  const auth = await protectRoute(req, entity, 'POST');
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const created = await createEntity(entity, body, {
      userId: auth.userId,
      headers: req.headers,
      roleSlug: auth.session.user.roleSlug,
    });
    return ok(created, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur création.';
    const status = message.startsWith('Validation') ? 400 : 500;
    return fail(message, status);
  }
}
