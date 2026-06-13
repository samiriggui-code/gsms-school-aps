import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import { getInstructorProfileReadOnly } from '@/lib/instructor/instructor-profile-data';

/** Profil formateur — consultation seule (données RH). */
export async function GET() {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const profile = await getInstructorProfileReadOnly(auth.ctx.userId);
    if (!profile) return fail('Profil formateur introuvable.', 404);
    return ok({ profile, readOnly: true });
  } catch (e) {
    return fail('Impossible de charger le profil.', 500, e);
  }
}
