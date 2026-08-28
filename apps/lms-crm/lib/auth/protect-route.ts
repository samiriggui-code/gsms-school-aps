import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import type { NextResponse } from 'next/server';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { permissionForEntityMethod } from '@/lib/auth/entity-registry';
import type { EntityMethod } from '@/lib/framework/entity';
import { fail } from '@/app/api/_shared/http/response';

export type ProtectRouteOk = {
  ok: true;
  session: Session;
  userId: string;
  permission: string;
};

export type ProtectRouteErr = {
  ok: false;
  response: NextResponse;
};

/**
 * Wrapper pour routes ad hoc hors du générateur `/api/entities/*`.
 * Fail-closed si l’entité/méthode n’est pas déclarée dans ENTITY_REGISTRY.
 */
export async function protectRoute(
  _req: NextRequest,
  entity: string,
  method: EntityMethod,
): Promise<ProtectRouteOk | ProtectRouteErr> {
  const permission = permissionForEntityMethod(entity, method);
  if (!permission) {
    return {
      ok: false,
      response: fail('Accès refusé — entité ou méthode non déclarée.', 403),
    };
  }
  const auth = await requireCrmApiAuth(permission);
  if (!auth.ok) {
    return { ok: false, response: auth.response };
  }
  return {
    ok: true,
    session: auth.session,
    userId: auth.userId,
    permission,
  };
}
