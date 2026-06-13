import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import {
  deleteInstructorAnnouncement,
  updateInstructorAnnouncement,
} from '@/lib/instructor/instructor-announcements-data';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { id } = await context.params;

  let body: {
    title?: string;
    content?: string;
    isPublished?: boolean;
    publishedAt?: string | null;
    sessionId?: string | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  try {
    const item = await updateInstructorAnnouncement(auth.ctx.userId, id, body);
    if (!item) return fail('Annonce introuvable.', 404);
    return ok({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Mise à jour impossible.';
    return fail(msg, msg.includes('assignée') ? 403 : 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { id } = await context.params;

  try {
    const deleted = await deleteInstructorAnnouncement(auth.ctx.userId, id);
    if (!deleted) return fail('Annonce introuvable.', 404);
    return ok({ id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Suppression impossible.';
    return fail(msg, msg.includes('assignée') ? 403 : 500, e);
  }
}
