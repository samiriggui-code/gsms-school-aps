import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { listSessionSuiviDocuments } from '@/lib/suivi-formations/session-document-store';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { sessionId } = await context.params;

  try {
    const items = await listSessionSuiviDocuments(sessionId);
    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger les documents.', 500, error);
  }
}
