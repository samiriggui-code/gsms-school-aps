import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { SessionConventionStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { upsertSessionConvention } from '@/lib/vie-scolaire/session-convention-lifecycle';

type Ctx = { params: Promise<{ id: string; conventionId: string }> };

const ALLOWED = new Set(Object.values(SessionConventionStatus));

/** WF-08 — avance le statut d'une convention participant (ex. SIGNED / ARCHIVED). */
export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id: sessionId, conventionId } = await context.params;
  let body: { status?: string } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as typeof body;
  } catch {
    /* optional */
  }

  const status = body.status?.trim();
  if (!status || !ALLOWED.has(status as SessionConventionStatus)) {
    return fail('status invalide', 400);
  }

  const row = await prisma.formationSessionConvention.findFirst({
    where: { id: conventionId, sessionId },
  });
  if (!row) return fail('Convention introuvable.', 404);

  const updated = await upsertSessionConvention(prisma, {
    sessionId,
    participantId: row.participantId,
    status: status as SessionConventionStatus,
    fileAssetId: row.fileAssetId,
  });

  return ok({
    id: updated.id,
    status: updated.status,
    sentAt: updated.sentAt?.toISOString() ?? null,
    viewedAt: updated.viewedAt?.toISOString() ?? null,
    signedAt: updated.signedAt?.toISOString() ?? null,
  });
}
