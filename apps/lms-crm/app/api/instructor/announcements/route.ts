import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import {
  createInstructorAnnouncement,
  listInstructorAnnouncements,
} from '@/lib/instructor/instructor-announcements-data';

export async function GET() {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const items = await listInstructorAnnouncements(auth.ctx.userId);
    return ok({ items });
  } catch (e) {
    return fail('Impossible de charger les annonces.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  let body: {
    formationId?: string;
    sessionId?: string | null;
    title?: string;
    content?: string;
    isPublished?: boolean;
    publishedAt?: string | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const formationId = body.formationId?.trim();
  const title = body.title?.trim();
  const content = body.content?.trim();

  if (!formationId) return fail('formationId est requis.', 400);
  if (!title) return fail('title est requis.', 400);
  if (!content) return fail('content est requis.', 400);

  try {
    const item = await createInstructorAnnouncement(auth.ctx.userId, {
      formationId,
      sessionId: body.sessionId ?? null,
      title,
      content,
      isPublished: body.isPublished,
      publishedAt: body.publishedAt,
    });
    return ok({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Création impossible.';
    return fail(msg, msg.includes('assignée') ? 403 : 500, e);
  }
}
