import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getAuthOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '@/lib/doctype/bootstrap';
import { principalFromSession } from '@/lib/doctype/principal';
import { getResourceService, listParamsFromRequest } from '@/lib/doctype/resource';

type Params = { params: Promise<{ doctype: string }> };

async function gated(doctype: string) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.id) return { error: fail('Unauthorized request', 401) as ReturnType<typeof fail> };

  ensureDocTypeBootstrap();
  if (getDocTypeBootstrapStatus() === 'failed') {
    return { error: fail(getDocTypeBootstrapError() ?? 'DocType bootstrap failed', 503) };
  }

  const registry = ensureDocTypeBootstrap();
  if (!registry.hasDocType(doctype)) {
    return { error: fail(`Unknown DocType: ${doctype}`, 404) };
  }

  return { session, registry };
}

/** Canonical resource list + create (G1-E). */
export async function GET(req: NextRequest, context: Params) {
  const { doctype } = await context.params;
  const gate = await gated(doctype);
  if ('error' in gate) return gate.error;

  try {
    const result = await getResourceService().list(
      doctype,
      principalFromSession(gate.session),
      listParamsFromRequest(req),
    );
    return ok({ doctype: gate.registry.resolveName(doctype), ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur liste.';
    const status = message.startsWith('Permission denied') ? 403 : 500;
    return fail(message, status);
  }
}

export async function POST(req: NextRequest, context: Params) {
  const { doctype } = await context.params;
  const gate = await gated(doctype);
  if ('error' in gate) return gate.error;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const created = await getResourceService().create(
      doctype,
      body,
      principalFromSession(gate.session),
    );
    return ok(created, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur création.';
    if (message.startsWith('Permission denied')) return fail(message, 403);
    const status = message.startsWith('Validation') ? 400 : 500;
    return fail(message, status);
  }
}
