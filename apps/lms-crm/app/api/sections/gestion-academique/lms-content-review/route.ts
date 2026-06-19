import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  listPendingLmsContent,
  reviewLmsContent,
} from '@/lib/lms/admin-content-review-data';
import { isLmsContentReviewRequired } from '@/lib/portal/lms-content-review';
import {
  CRM_PERMISSION,
  LMS_PERMISSION,
  sessionHasAnyPermission,
} from '@/lib/auth/crm-permissions';
import { getServerSession } from 'next-auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  if (
    !sessionHasAnyPermission(session, [
      CRM_PERMISSION.academiqueView,
      LMS_PERMISSION.contentReview,
    ])
  ) {
    return fail('Accès refusé.', 403);
  }

  try {
    const items = await listPendingLmsContent();
    return ok({ items, reviewRequired: isLmsContentReviewRequired() });
  } catch (e) {
    return fail('Impossible de charger la file de validation.', 500, e);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  if (
    !sessionHasAnyPermission(session, [
      LMS_PERMISSION.contentReview,
      LMS_PERMISSION.contentPublish,
    ])
  ) {
    return fail('Accès refusé — permission de validation LMS requise.', 403);
  }

  let body: {
    kind?: 'chapter' | 'activity';
    id?: string;
    decision?: 'APPROVED' | 'REJECTED';
    reviewNote?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  if (!body.kind || !body.id || !body.decision) {
    return fail('kind, id et decision sont requis.', 400);
  }

  try {
    await reviewLmsContent(body.kind, body.id, session.user.id, body.decision, body.reviewNote);
    const items = await listPendingLmsContent();
    return ok({ items });
  } catch (e) {
    return fail('Validation impossible.', 500, e);
  }
}
