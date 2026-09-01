import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  MODULE_WORKSPACE_VIEW_KEYS,
  ModuleWorkspaceService,
  type ModuleWorkspaceViewKey,
} from '@repo/api-core';
import {
  CRM_PERMISSION,
  GOVERNANCE_PERMISSION,
  sessionHasPermission,
} from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ viewKey: string }> };

function isViewKey(value: string): value is ModuleWorkspaceViewKey {
  return (MODULE_WORKSPACE_VIEW_KEYS as readonly string[]).includes(value);
}

function permissionForViewKey(viewKey: ModuleWorkspaceViewKey): string | null {
  if (viewKey.startsWith('finance-')) return CRM_PERMISSION.financeView;
  if (viewKey.startsWith('comm-')) return CRM_PERMISSION.communicationView;
  if (viewKey.startsWith('support-')) return CRM_PERMISSION.supportView;
  if (viewKey.startsWith('gouvernance-')) return GOVERNANCE_PERMISSION.storageAdmin;
  if (viewKey.startsWith('pilotage-')) return CRM_PERMISSION.pilotageView;
  return null;
}

export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { viewKey } = await context.params;
  if (!isViewKey(viewKey)) {
    return fail('Vue workspace inconnue.', 404);
  }

  const needed = permissionForViewKey(viewKey);
  if (!needed || !sessionHasPermission(session, needed)) {
    return fail('Forbidden', 403);
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const q = (sp.get('q') ?? '').trim();

  try {
    const service = new ModuleWorkspaceService(prisma);
    const payload = await service.getView(viewKey, { page, limit, q });
    return ok(payload);
  } catch (error) {
    console.error(`[workspace/${viewKey}]`, error);
    return fail('Impossible de charger la vue.', 500, error);
  }
}
