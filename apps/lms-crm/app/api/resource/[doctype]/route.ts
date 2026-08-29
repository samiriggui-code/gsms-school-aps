import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getAuthOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { hasPermission } from '@repo/doctype';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '@/lib/doctype/bootstrap';
import { principalFromSession } from '@/lib/doctype/principal';

/**
 * G1-A Resource list stub — metadata + permission gate.
 * Full Prisma CRUD via Document runtime arrives in later G1 steps.
 * Legacy /api/entities remains source of truth for data until flag cutover.
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

  const meta = registry.getMeta(doctype);
  const principal = principalFromSession(session);
  if (!hasPermission({ meta, principal, action: 'read' })) {
    return fail('Accès refusé', 403);
  }

  return ok({
    doctype: meta.name,
    label: meta.label,
    message:
      'G1-A: Resource API gated. Data CRUD still on /api/entities until Document runtime (G1 later).',
    aliases: meta.aliases,
    searchFields: meta.searchFields,
    data: [],
    pagination: { total: 0, page: 1, limit: meta.list.pageSize ?? 25 },
  });
}
