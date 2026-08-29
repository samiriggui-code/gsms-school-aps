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
import { getResourceService } from '@/lib/doctype/resource';

type Params = { params: Promise<{ doctype: string; name: string }> };

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

export async function GET(_req: NextRequest, context: Params) {
  const { doctype, name } = await context.params;
  const gate = await gated(doctype);
  if ('error' in gate) return gate.error;

  try {
    const row = await getResourceService().get(doctype, name, principalFromSession(gate.session));
    if (!row) return fail('Enregistrement introuvable.', 404);
    return ok(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lecture.';
    const status = message.startsWith('Permission denied') ? 403 : 500;
    return fail(message, status);
  }
}

export async function PATCH(req: NextRequest, context: Params) {
  const { doctype, name } = await context.params;
  const gate = await gated(doctype);
  if ('error' in gate) return gate.error;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const updated = await getResourceService().update(
      doctype,
      name,
      body,
      principalFromSession(gate.session),
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

export async function DELETE(_req: NextRequest, context: Params) {
  const { doctype, name } = await context.params;
  const gate = await gated(doctype);
  if ('error' in gate) return gate.error;

  try {
    await getResourceService().delete(doctype, name, principalFromSession(gate.session));
    return ok({ name, deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur suppression.';
    if (message === 'Record not found') return fail(message, 404);
    if (message.startsWith('Permission denied')) return fail(message, 403);
    return fail(message, 500);
  }
}
