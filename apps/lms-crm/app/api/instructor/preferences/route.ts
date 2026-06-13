import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import {
  getInstructorWorkspacePreferences,
  updateInstructorWorkspacePreferences,
} from '@/lib/instructor/instructor-preferences-data';
import { InstructorWorkspacePreferencesPatchSchema } from '@/lib/instructor/instructor-workspace-preferences';

export async function GET() {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const preferences = await getInstructorWorkspacePreferences(auth.ctx.userId);
    if (!preferences) return fail('Préférences introuvables.', 404);
    return ok({ preferences });
  } catch (e) {
    return fail('Impossible de charger les préférences.', 500, e);
  }
}

export async function PATCH(request: Request) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = InstructorWorkspacePreferencesPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Préférences invalides.', 400, parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return fail('Aucune préférence à mettre à jour.', 400);
  }

  try {
    const preferences = await updateInstructorWorkspacePreferences(auth.ctx.userId, parsed.data);
    if (!preferences) return fail('Préférences introuvables.', 404);
    return ok({ preferences });
  } catch (e) {
    return fail('Impossible de mettre à jour les préférences.', 500, e);
  }
}
