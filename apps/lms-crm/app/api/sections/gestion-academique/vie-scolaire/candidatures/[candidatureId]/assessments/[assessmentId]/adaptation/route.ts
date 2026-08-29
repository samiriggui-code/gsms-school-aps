import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AdaptationStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  AdaptationAdvanceError,
  advanceAdaptationStatus,
} from '@/lib/of/candidature-adaptation';

type Ctx = { params: Promise<{ candidatureId: string; assessmentId: string }> };

const ALLOWED = new Set(Object.values(AdaptationStatus));

/** WF-04 — avance le cycle d'adaptation (PENDING → APPROVED → IMPLEMENTED). */
export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { candidatureId, assessmentId } = await context.params;
  let body: { adaptationStatus?: string; adaptationNotes?: string } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as typeof body;
  } catch {
    /* optional */
  }

  const nextStatus = body.adaptationStatus?.trim();
  if (!nextStatus || !ALLOWED.has(nextStatus as AdaptationStatus)) {
    return fail('adaptationStatus invalide', 400);
  }

  const row = await prisma.candidatureAssessment.findFirst({
    where: { id: assessmentId, candidatureId },
    select: { id: true },
  });
  if (!row) return fail('Assessment introuvable.', 404);

  try {
    const updated = await advanceAdaptationStatus(
      prisma,
      assessmentId,
      nextStatus as AdaptationStatus,
      typeof body.adaptationNotes === 'string' ? body.adaptationNotes : undefined,
    );
    return ok(updated);
  } catch (e) {
    if (e instanceof AdaptationAdvanceError) return fail(e.message, 400);
    throw e;
  }
}
