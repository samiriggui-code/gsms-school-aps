import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { ExamRetakeError, proposeExamRetake } from '@/lib/vie-scolaire/exam-retake-service';

type Ctx = { params: Promise<{ participantId: string }> };

/** WF-24 — propose un rattrapage (FAILED uniquement). */
export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { participantId } = await context.params;
  let body: { retakeDate?: string; notes?: string } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const rawDate = body.retakeDate?.trim();
  if (!rawDate) return fail('retakeDate requis (ISO).', 400);
  const retakeDate = new Date(rawDate);
  if (Number.isNaN(retakeDate.getTime())) return fail('retakeDate invalide.', 400);

  try {
    const result = await proposeExamRetake(
      prisma,
      participantId,
      retakeDate,
      typeof body.notes === 'string' ? body.notes : undefined,
    );
    return ok(result);
  } catch (e) {
    if (e instanceof ExamRetakeError) {
      if (e.code === 'NOT_FOUND') return fail(e.message, 404);
      if (e.code === 'NOT_FAILED' || e.code === 'INVALID_DATE') return fail(e.message, 400);
    }
    throw e;
  }
}
