import { ok, fail } from '@/app/api/_shared/http/response';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import {
  listPortalAnnouncementsForLearner,
  resolveLearnerSessionIds,
} from '@/lib/portal/portal-session-announcements';

export async function GET() {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { userId, candidature } = auth.ctx;
  const formationId = candidature?.formationId ?? candidature?.formation?.id ?? null;
  const sessionIds = await resolveLearnerSessionIds(
    userId,
    candidature?.interestedSession?.id ?? null,
  );

  const announcements = await listPortalAnnouncementsForLearner({
    formationId,
    sessionIds,
  });

  return ok({ announcements, count: announcements.length });
}
