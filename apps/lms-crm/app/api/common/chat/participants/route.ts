import { ok, fail } from '@/app/api/_shared/http/response';
import { fetchScopedChatParticipants, requireChatSession } from '@/lib/chat-scope';

/** Utilisateurs invitables — cloisonnés par équipes RH et sessions partagées. */
export async function GET() {
  const auth = await requireChatSession();
  if ('error' in auth) return auth.error;

  const roleSlug = auth.session.user?.roleSlug ?? '';
  const users = await fetchScopedChatParticipants(auth.userId, roleSlug);
  return ok(users);
}
