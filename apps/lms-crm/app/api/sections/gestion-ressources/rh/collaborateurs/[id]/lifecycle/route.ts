import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  applyAccountLifecycle,
  type AccountLifecycleAction,
} from '@/lib/rh/account-lifecycle';
import { requireGestionRessourcesEdit } from '../../../../_lib/require-gestion-ressources-auth';

const ACTIONS = new Set<AccountLifecycleAction>(['suspend', 'archive', 'restore']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;
  const actorId = auth.session.user.id;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as AccountLifecycleAction;
  if (!ACTIONS.has(action)) {
    return fail('action invalide (suspend | archive | restore)', 400);
  }

  try {
    const updated = await applyAccountLifecycle(id, action, actorId);
    return ok({
      user: {
        id: updated.id,
        status: updated.status,
        isTrashed: updated.isTrashed,
        email: updated.email,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Action impossible.', 400);
  }
}
