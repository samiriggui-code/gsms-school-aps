import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import type { NextResponse } from 'next/server';
import type { DocAction } from '@repo/doctype';
import { hasPermission } from '@repo/doctype';
import { requireCrmApiAuth, requireAuthenticatedSession } from '@/lib/auth/require-permission';
import { permissionForEntityMethod } from '@/lib/auth/entity-registry';
import type { EntityMethod } from '@/lib/framework/entity';
import { fail } from '@/app/api/_shared/http/response';
import { isDocTypeV2Runtime } from '@/lib/doctype/runtime-flag';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapStatus,
  getDocTypeBootstrapError,
} from '@/lib/doctype/bootstrap';
import { principalFromSession } from '@/lib/doctype/principal';

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

function methodToDocAction(method: EntityMethod): DocAction {
  switch (method) {
    case 'GET':
      return 'read';
    case 'POST':
      return 'create';
    case 'PATCH':
      return 'write';
    case 'DELETE':
      return 'delete';
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}

/**
 * Wrapper pour routes ad hoc hors du générateur `/api/entities/*`.
 * Fail-closed si l’entité/méthode n’est pas déclarée.
 *
 * Dual-run: DOCTYPE_V2_RUNTIME=1 → PermissionEngine on DocMeta;
 * otherwise legacy ENTITY_REGISTRY permission slugs.
 */
export async function protectRoute(
  _req: NextRequest,
  entity: string,
  method: EntityMethod,
): Promise<ProtectRouteOk | ProtectRouteErr> {
  if (isDocTypeV2Runtime()) {
    ensureDocTypeBootstrap();
    if (getDocTypeBootstrapStatus() === 'failed') {
      return {
        ok: false,
        response: fail(getDocTypeBootstrapError() ?? 'DocType bootstrap failed', 503),
      };
    }
    const registry = ensureDocTypeBootstrap();
    if (!registry.hasDocType(entity)) {
      return {
        ok: false,
        response: fail('Accès refusé — DocType inconnu.', 403),
      };
    }
    const auth = await requireAuthenticatedSession();
    if ('error' in auth) {
      return { ok: false, response: auth.error };
    }
    const meta = registry.getMeta(entity);
    const principal = principalFromSession(auth.session);
    const action = methodToDocAction(method);
    if (!hasPermission({ meta, principal, action })) {
      return {
        ok: false,
        response: fail('Accès refusé — permission DocType requise.', 403),
      };
    }
    return {
      ok: true,
      session: auth.session,
      userId: auth.userId,
      permission: `doctype:${meta.name}:${action}`,
    };
  }

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
