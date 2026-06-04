import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { StatService } from '@repo/api-core';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const stats = await new StatService(prisma).getRhCertificationsStats();
    return ok({ stats });
  } catch (error) {
    return fail('Impossible de charger les statistiques certifications.', 500, error);
  }
}
