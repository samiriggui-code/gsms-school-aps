import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getAuthOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { buildMetaResponse } from '@repo/doctype';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '@/lib/doctype/bootstrap';
import { principalFromSession } from '@/lib/doctype/principal';

/**
 * G1-A Meta API — parallel to legacy entity schema endpoint.
 * Fail isolated: bootstrap failure → 503 (app remains up).
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ doctype: string }> },
) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const registry = ensureDocTypeBootstrap();
  if (getDocTypeBootstrapStatus() === 'failed') {
    return fail(getDocTypeBootstrapError() ?? 'DocType bootstrap failed', 503);
  }

  const { doctype } = await context.params;
  if (!registry.hasDocType(doctype)) {
    return fail(`Unknown DocType: ${doctype}`, 404);
  }

  try {
    const meta = registry.getMeta(doctype);
    const principal = principalFromSession(session);
    return ok(buildMetaResponse(meta, principal));
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Meta resolution failed', 500, e);
  }
}
