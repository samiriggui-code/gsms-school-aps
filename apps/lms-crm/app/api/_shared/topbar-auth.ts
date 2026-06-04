import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';

export async function requireSessionUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return { error: fail('Unauthorized request', 401) };
  }
  return { userId };
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
