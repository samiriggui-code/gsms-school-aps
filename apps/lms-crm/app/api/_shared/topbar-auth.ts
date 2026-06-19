import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import { sessionHasPermission } from '@/lib/auth/crm-permissions';
import { NOTIFICATIONS_VIEW_PERMISSION } from '@/lib/notifications-scope';

export async function requireSessionUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return { error: fail('Unauthorized request', 401) };
  }
  return { userId, session };
}

export async function requireNotificationsSession() {
  const auth = await requireSessionUserId();
  if ('error' in auth) return auth;
  if (!sessionHasPermission(auth.session, NOTIFICATIONS_VIEW_PERMISSION)) {
    return { error: fail('Accès notifications non autorisé.', 403) };
  }
  return auth;
}

export function displayUserName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.name || full || user.email;
}
