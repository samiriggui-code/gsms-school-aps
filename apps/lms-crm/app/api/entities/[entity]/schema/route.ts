import { NextRequest } from 'next/server';
import { fail, ok } from '@/app/api/_shared/http/response';
import { protectRoute } from '@/lib/auth/protect-route';
import { getPublicSchema } from '@/lib/framework/engine';
import { getEntityDefinition } from '@/lib/framework/registry';

type Params = { params: Promise<{ entity: string }> };

/** Expose la définition de champs au frontend (formulaire générique). */
export async function GET(req: NextRequest, { params }: Params) {
  const { entity } = await params;
  if (!getEntityDefinition(entity)) {
    return fail('Entité inconnue.', 404);
  }

  const auth = await protectRoute(req, entity, 'GET');
  if (!auth.ok) return auth.response;

  try {
    return ok(getPublicSchema(entity));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur schema.';
    return fail(message, 500);
  }
}
