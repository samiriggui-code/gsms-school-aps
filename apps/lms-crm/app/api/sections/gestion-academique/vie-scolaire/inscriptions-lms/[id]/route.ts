import { getServerSession } from 'next-auth/next';
import { EnrollmentStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  canSetLmsEnrollmentStatus,
  lmsEnrollmentStatusActions,
} from '@/lib/lms/lms-enrollment-transitions';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — changer le statut d'une inscription LMS. */
export async function PATCH(request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  if (!id) return fail('id is required', 400);

  let body: { status?: string; notes?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const nextStatus = body.status as EnrollmentStatus | undefined;
  if (!nextStatus || !Object.values(EnrollmentStatus).includes(nextStatus)) {
    return fail('Invalid status', 400);
  }

  try {
    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) return fail('Enrollment not found', 404);

    if (!canSetLmsEnrollmentStatus(existing.status, nextStatus)) {
      return fail(
        `Transition ${existing.status} → ${nextStatus} not allowed. Allowed: ${lmsEnrollmentStatusActions(existing.status).join(', ') || 'none'}`,
        400,
      );
    }

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(body.notes !== undefined
          ? { notes: typeof body.notes === 'string' ? body.notes.trim() || null : null }
          : {}),
      },
      select: {
        id: true,
        status: true,
        notes: true,
        updatedAt: true,
      },
    });

    return ok({ enrollment });
  } catch (e) {
    console.error('[inscriptions-lms] PATCH', e);
    return fail('Failed to update LMS enrollment', 500);
  }
}
