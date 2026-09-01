import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { LMS_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type RouteParams = { params: Promise<{ id: string }> };

/** PATCH — noter / commenter une soumission. */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, LMS_PERMISSION.contentReview)) return fail('Forbidden', 403);

  const { id: assignmentId } = await params;

  let body: { submissionId?: string; grade?: number; feedback?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const submissionId = body.submissionId?.trim();
  if (!submissionId) return fail('submissionId is required', 400);

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, maxPoints: true },
  });
  if (!assignment) return fail('Assignment not found', 404);

  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId, assignmentId },
    select: { id: true },
  });
  if (!submission) return fail('Submission not found', 404);

  if (body.grade != null) {
    if (typeof body.grade !== 'number' || body.grade < 0 || body.grade > assignment.maxPoints) {
      return fail(`grade must be between 0 and ${assignment.maxPoints}`, 400);
    }
  }

  try {
    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        ...(body.grade != null ? { grade: body.grade } : {}),
        ...(body.feedback !== undefined ? { feedback: body.feedback?.trim() || null } : {}),
      },
      select: {
        id: true,
        grade: true,
        feedback: true,
        updatedAt: true,
      },
    });

    return ok({ submission: updated });
  } catch (e) {
    console.error('[devoirs/submissions] PATCH', e);
    return fail('Failed to grade submission', 500);
  }
}
