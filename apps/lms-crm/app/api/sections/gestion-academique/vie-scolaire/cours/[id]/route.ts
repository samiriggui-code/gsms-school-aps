import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ id: string }> };

/** PATCH — publier / dépublier un cours LMS (CRM). */
export async function PATCH(request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  if (!id) return fail('id is required', 400);

  let body: { isPublished?: boolean; title?: string; description?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const data: { isPublished?: boolean; title?: string; description?: string | null } = {};
  if (typeof body.isPublished === 'boolean') data.isPublished = body.isPublished;
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (body.description !== undefined) {
    data.description =
      typeof body.description === 'string' ? body.description.trim() || null : null;
  }

  if (Object.keys(data).length === 0) {
    return fail('No valid fields to update', 400);
  }

  try {
    const existing = await prisma.course.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return fail('Course not found', 404);

    const course = await prisma.course.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        isPublished: true,
        updatedAt: true,
      },
    });
    return ok({ course });
  } catch (e) {
    console.error('[cours] PATCH', e);
    return fail('Failed to update LMS course', 500);
  }
}
