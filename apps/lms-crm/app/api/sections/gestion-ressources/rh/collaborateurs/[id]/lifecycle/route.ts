import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  applyAccountLifecycle,
  type AccountLifecycleAction,
} from '@/lib/rh/account-lifecycle';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { requireAnyPermission } from '@/lib/auth/require-permission';

const ACTIONS = new Set<AccountLifecycleAction>(['suspend', 'archive', 'restore']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // RH (collaborateurs / formateurs) ou vie scolaire (élèves / stagiaires)
  const auth = await requireAnyPermission([
    CRM_PERMISSION.ressourcesEdit,
    CRM_PERMISSION.academiqueEdit,
  ]);
  if ('error' in auth) return auth.error;
  const actorId = auth.userId;

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
