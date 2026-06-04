import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  return session;
}
