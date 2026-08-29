import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildQualiopiCoverage } from '@/lib/of/qualiopi-coverage';

/** GET — couverture Evidence des 32 indicateurs Qualiopi V9 (G9). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const data = await buildQualiopiCoverage(prisma);
    return ok(data);
  } catch (e) {
    console.error('[qualiopi/coverage] GET', e);
    return fail('Failed to compute Qualiopi coverage', 500);
  }
}
