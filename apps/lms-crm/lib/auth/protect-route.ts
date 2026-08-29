import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import type { NextResponse } from 'next/server';
import type { DocAction } from '@repo/doctype';
import { hasPermission } from '@repo/doctype';
import { requireAuthenticatedSession } from '@/lib/auth/require-permission';
import { fail } from '@/app/api/_shared/http/response';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '@/lib/doctype/bootstrap';
import { principalFromSession } from '@/lib/doctype/principal';

export type EntityMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

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
 * G1-E: PermissionEngine only (legacy ENTITY_REGISTRY removed).
 */
export async function protectRoute(
  _req: NextRequest,
  entity: string,
  method: EntityMethod,
): Promise<ProtectRouteOk | ProtectRouteErr> {
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
